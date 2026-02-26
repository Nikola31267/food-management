import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { requireAdmin } from "@/lib/auth";
import User from "@/models/User";
import DayDelivery from "@/models/VerifyCount";

const DAY_ORDER = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"];

export async function GET(req) {
  try {
    requireAdmin(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const weekStart = searchParams.get("weekStart");

    if (!weekStart) {
      return NextResponse.json({ message: "weekStart is required" }, { status: 400 });
    }

    // 1. Get ALL expected meals grouped by day + mealName for this week
    const expectedRows = await User.aggregate([
      { $unwind: "$archivedOrders" },
      {
        $match: {
          "archivedOrders.weekStart": new Date(weekStart),
        },
      },
      { $unwind: "$archivedOrders.orders" },
      { $unwind: "$archivedOrders.orders.days" },
      { $unwind: "$archivedOrders.orders.days.meals" },
      {
        $group: {
          _id: {
            day: "$archivedOrders.orders.days.day",
            mealName: "$archivedOrders.orders.days.meals.mealName",
          },
          expectedCount: {
            $sum: {
              $ifNull: ["$archivedOrders.orders.days.meals.quantity", 1],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          day: "$_id.day",
          mealName: "$_id.mealName",
          expectedCount: 1,
        },
      },
    ]);

    // 2. Get all saved delivery records for this week
    const deliveries = await DayDelivery.find({
      weekStart: new Date(weekStart),
    }).lean();

    // Build lookup: day -> mealName -> deliveredCount
    const deliveryLookup = new Map();
    for (const doc of deliveries) {
      if (!deliveryLookup.has(doc.day)) deliveryLookup.set(doc.day, new Map());
      for (const item of doc.items) {
        deliveryLookup.get(doc.day).set(item.mealName, item.deliveredCount);
      }
    }

    // 3. Group expected rows by day, preserving per-day meal counts
    const dayMap = new Map();
    for (const row of expectedRows) {
      if (!dayMap.has(row.day)) dayMap.set(row.day, []);
      const dayDeliveries = deliveryLookup.get(row.day);
      dayMap.get(row.day).push({
        mealName: row.mealName,
        expectedCount: row.expectedCount,
        deliveredCount: dayDeliveries?.has(row.mealName)
          ? dayDeliveries.get(row.mealName)
          : null,
      });
    }

    // 4. Return in correct day order, only days that have meals
    const results = DAY_ORDER.filter((day) => dayMap.has(day)).map((day) => ({
      day,
      items: dayMap.get(day),
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET /api/verify-count-archived error:", error);
    return NextResponse.json({ message: "Failed to fetch." }, { status: 500 });
  }
}