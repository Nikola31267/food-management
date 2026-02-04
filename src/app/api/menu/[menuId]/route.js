import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import WeeklyMenu from "@/models/Menu";
import { Parser } from "json2csv";

export async function PUT(req, { params }) {
  await connectDB();

  try {
    const decoded = verifyToken(req);
    const user = await User.findById(decoded.id);

    if (user.role !== "admin") {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    const { menuId } = params;
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
    const user = await User.findById(decoded.id);

    if (user.role !== "admin") {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    const { menuId } = params;
    const download = new URL(req.url).searchParams.get("download") === "true";

    const usersWithOrders = await User.find(
      { "orders.menuId": menuId },
      { fullName: 1, grade: 1, orders: 1 },
    );

    let csv;

    if (download) {
      const rows = [];

      usersWithOrders.forEach((user) => {
        const row = {
          Name: user.fullName || "—",
          Grade: user.grade || "—",
          Понеделник: "—",
          Вторник: "—",
          Сряда: "—",
          Четвъртък: "—",
          Петък: "—",
          Total: 0,
        };

        user.orders
          .filter((o) => o.menuId.toString() === menuId)
          .forEach((order) => {
            row.Total += order.totalPrice || 0;

            order.days.forEach((day) => {
              row[day.day] =
                day.meals
                  .map((m) => `${m.mealName} x${m.quantity}`)
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
      message: "Weekly menu and orders deleted",
    });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
