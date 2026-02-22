import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import WeeklyMenu from "@/models/Menu";
import Unpaid from "@/models/Unpaid";
import { Parser } from "json2csv";
import mongoose from "mongoose";

function isOrderPaid(order) {
  if (order?.paid === true) return true;
  return false;
}

export async function DELETE(req, { params }) {
  await connectDB();

  try {
    const decoded = verifyToken(req);
    const admin = await User.findById(decoded.id);

    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    const { menuId } = await params;
    const download = new URL(req.url).searchParams.get("download") === "true";

    const menu = await WeeklyMenu.findById(menuId).lean();
    if (!menu) {
      return NextResponse.json({ message: "Menu not found" }, { status: 404 });
    }

    const usersWithOrders = await User.find(
      { "orders.menuId": menuId },
      { email: 1, fullName: 1, grade: 1, orders: 1 },
    ).lean();

    let csv;
    if (download) {
      const rows = [];

      usersWithOrders.forEach((u) => {
        const row = {
          Name: u.fullName || "—",
          Grade: u.grade || "—",
          Понеделник: "—",
          Вторник: "—",
          Сряда: "—",
          Четвъртък: "—",
          Петък: "—",
          Total: 0,
        };

        u.orders
          .filter((o) => o.menuId.toString() === menuId)
          .forEach((order) => {
            row.Total += order.totalPrice || 0;

            order.days?.forEach((day) => {
              row[day.day] =
                day.meals
                  ?.map((m) => `${m.mealName} x${m.quantity}`)
                  .join(", ") || "—";
            });
          });

        rows.push(row);
      });

      const parser = new Parser({
        fields: [
          "Name",
          "Grade",
          "Понеделник",
          "Вторник",
          "Сряда",
          "Четвъртък",
          "Петък",
          "Total",
        ],
      });

      csv = parser.parse(rows);
    }

    const menuObjectId = new mongoose.Types.ObjectId(menuId);

    const bulkOps = usersWithOrders.map((u) => {
      const matchingOrders = (u.orders || []).filter(
        (o) => o.menuId.toString() === menuId,
      );

      const total = matchingOrders.reduce(
        (sum, o) => sum + (o.totalPrice || 0),
        0,
      );

      const archiveDoc = {
        menuId: menuObjectId,
        weekStart: menu.weekStart,
        weekEnd: menu.weekEnd,
        userEmail: u.email,
        userFullName: u.fullName,
        userGrade: u.grade,
        orders: matchingOrders,
        total,
        archivedAt: new Date(),
      };

      return {
        updateOne: {
          filter: { _id: u._id },
          update: {
            $push: { archivedOrders: archiveDoc },
            $pull: { orders: { menuId: menuObjectId } },
          },
        },
      };
    });

    if (bulkOps.length) {
      await User.bulkWrite(bulkOps, { ordered: false });
    }

    const menuDate =
      menu.weekStart && menu.weekEnd
        ? `${new Date(menu.weekStart).toISOString().slice(0, 10)} - ${new Date(
            menu.weekEnd,
          )
            .toISOString()
            .slice(0, 10)}`
        : menu.weekStart
          ? new Date(menu.weekStart).toISOString().slice(0, 10)
          : String(menuId);

    const unpaidDocs = [];

    usersWithOrders.forEach((u) => {
      const matchingOrders = (u.orders || []).filter(
        (o) => o.menuId.toString() === menuId,
      );

      const unpaidTotal = matchingOrders
        .filter((o) => !isOrderPaid(o))
        .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      if (unpaidTotal > 0) {
        unpaidDocs.push({
          name: u.fullName || "—",
          grade: u.grade || "—",
          total: unpaidTotal,
          menuDate,
        });
      }
    });

    if (unpaidDocs.length) {
      await Unpaid.insertMany(unpaidDocs, { ordered: false });
    }

    await WeeklyMenu.findByIdAndDelete(menuId);

    if (download) {
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="orders-${menuId}.csv"`,
        },
      });
    }

    return NextResponse.json({
      message: "Weekly menu deleted; orders archived.",
      archivedCount: bulkOps.length,
      unpaidCount: unpaidDocs.length,
      unpaidSaved: unpaidDocs.length,
      menuDate,
    });
  } catch (err) {
    console.error("DELETE /api/menu error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  await connectDB();

  try {
    const decoded = verifyToken(req);
    const admin = await User.findById(decoded.id);

    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    const { menuId } = params;
    if (!mongoose.Types.ObjectId.isValid(menuId)) {
      return NextResponse.json({ message: "Invalid menu id" }, { status: 400 });
    }

    const body = await req.json();

    // Basic validation (keep it light, your UI already formats well)
    if (!body?.orderDeadline) {
      return NextResponse.json(
        { message: "orderDeadline is required" },
        { status: 400 },
      );
    }

    // Normalize/clean days/meals the same way your frontend builds them
    const days = Array.isArray(body.days) ? body.days : [];
    const normalizedDays = days.map((d) => ({
      day: String(d.day || "").trim(),
      meals: (Array.isArray(d.meals) ? d.meals : [])
        .filter((m) => String(m?.name || "").trim())
        .map((m) => ({
          name: String(m.name || "").trim(),
          weight: String(m.weight || "").trim(),
          price:
            m.price === "" || m.price == null
              ? null
              : Number(String(m.price).replace(",", ".")),
        })),
    }));

    const updateDoc = {
      weekStart: body.weekStart ? new Date(body.weekStart) : null,
      weekEnd: body.weekEnd ? new Date(body.weekEnd) : null,
      orderDeadline: new Date(body.orderDeadline),
      days: normalizedDays,
    };

    // If you store CSV in the menu document, allow updating it too
    // (Frontend PUT currently does NOT send these, but this supports it if you decide to)
    if (typeof body.menuFile === "string") updateDoc.menuFile = body.menuFile;
    if (typeof body.menuFileName === "string")
      updateDoc.menuFileName = body.menuFileName;

    const updated = await WeeklyMenu.findByIdAndUpdate(menuId, updateDoc, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return NextResponse.json({ message: "Menu not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Menu updated successfully",
      menu: updated,
    });
  } catch (err) {
    console.error("PUT /api/menu/:menuId error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
