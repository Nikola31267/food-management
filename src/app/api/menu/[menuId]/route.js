import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import WeeklyMenu from "@/models/Menu";
import OldOrder from "@/models/OldOrder";
import { Parser } from "json2csv";


export async function PUT(req, { params }) {
  await connectDB();

  try {
    const decoded = verifyToken(req);
    const user = await User.findById(decoded.id);

    if (user.role !== "admin") {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    const { menuId } = await params;
    const { weekStart, weekEnd, days, orderDeadline } = await req.json();

    const deadlineDate = new Date(orderDeadline);
    if (!orderDeadline || isNaN(deadlineDate)) {
      return NextResponse.json(
        { message: "Invalid order deadline" },
        { status: 400 },
      );
    }

    const updatedMenu = await WeeklyMenu.findByIdAndUpdate(
      menuId,
      {
        weekStart,
        weekEnd,
        orderDeadline: deadlineDate,
        days,
      },
      { new: true },
    );

    if (!updatedMenu) {
      return NextResponse.json({ message: "Menu not found" }, { status: 404 });
    }

    return NextResponse.json(updatedMenu);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  await connectDB();

  try {
    const decoded = verifyToken(req);
    const admin = await User.findById(decoded.id);

    if (admin.role !== "admin") {
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
      { email: 1, fullName: 1, grade: 1, orders: 1 }
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

            order.days.forEach((day) => {
              row[day.day] =
                day.meals?.map((m) => `${m.mealName} x${m.quantity}`).join(", ") || "—";
            });
          });

        rows.push(row);
      });

      const parser = new Parser({
        fields: ["Name", "Grade", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Total"],
      });

      csv = parser.parse(rows);
    }

    // ---- ARCHIVE ORDERS ----
    // One archive doc per user per menu
    const archiveDocs = usersWithOrders.map((u) => {
      const matchingOrders = u.orders.filter((o) => o.menuId.toString() === menuId);

      const total = matchingOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      return {
        menuId,
        weekStart: menu.weekStart,
        weekEnd: menu.weekEnd,
        userId: u._id,
        userEmail: u.email,
        userFullName: u.fullName,
        userGrade: u.grade,
        orders: matchingOrders,
        total,
        archivedAt: new Date(),
      };
    });

    if (archiveDocs.length) {
      await OldOrder.insertMany(archiveDocs, { ordered: false });
    }

    await WeeklyMenu.findByIdAndDelete(menuId);

    await User.updateMany({}, { $pull: { orders: { menuId } } });


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
      archivedCount: archiveDocs.length,
    });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}