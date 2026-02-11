import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import DayDelivery from "@/models/DayDelivery";

const DAY_ORDER = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"];

export async function GET(req) {
  try {
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // optional role gate (edit as needed)
    // if (session.user.role !== "admin") {
    //   return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    // }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const menuId = searchParams.get("menuId");
    if (!menuId) {
      return NextResponse.json(
        { message: "menuId is required" },
        { status: 400 },
      );
    }

    const mid = new mongoose.Types.ObjectId(menuId);

    // 1) expected counts from embedded User.orders
    const expectedByDay = await User.aggregate([
      { $unwind: "$orders" },
      { $match: { "orders.menuId": mid } },
      { $unwind: "$orders.days" },
      { $unwind: "$orders.days.meals" },
      {
        $group: {
          _id: {
            day: "$orders.days.day",
            mealName: "$orders.days.meals.mealName",
          },
          expectedCount: {
            $sum: { $ifNull: ["$orders.days.meals.quantity", 1] },
          },
        },
      },
      {
        $group: {
          _id: "$_id.day",
          items: {
            $push: {
              mealName: "$_id.mealName",
              expectedCount: "$expectedCount",
            },
          },
        },
      },
      { $project: { _id: 0, day: "$_id", items: 1 } },
    ]);

    // normalize to include all weekdays even if empty
    const expectedMap = new Map(
      expectedByDay.map((d) => [d.day, d.items || []]),
    );
    const expectedNormalized = DAY_ORDER.map((day) => ({
      day,
      items: expectedMap.get(day) || [],
    }));

    // 2) delivered counts from DayDelivery
    const deliveries = await DayDelivery.find({ menuId }).lean();
    const deliveredByDay = new Map(
      deliveries.map((d) => [d.day, d.items || []]),
    );

    // 3) merge expected + delivered
    const merged = expectedNormalized.map((d) => {
      const deliveredItems = deliveredByDay.get(d.day) || [];
      const deliveredLookup = new Map(
        deliveredItems.map((x) => [x.mealName, x.deliveredCount]),
      );

      return {
        day: d.day,
        items: (d.items || [])
          .slice()
          .sort((a, b) => a.mealName.localeCompare(b.mealName, "bg"))
          .map((x) => ({
            mealName: x.mealName,
            expectedCount: x.expectedCount,
            deliveredCount: deliveredLookup.get(x.mealName) ?? null,
          })),
      };
    });

    return NextResponse.json(merged);
  } catch (err) {
    console.error("GET /api/daily-orders error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
