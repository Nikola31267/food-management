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
    const weekEnd = searchParams.get("weekEnd");

    if (!weekStart) {
      return NextResponse.json({ message: "weekStart is required" }, { status: 400 });
    }

    // 1. Find which days actually have orders for this week (from archived orders)
    const daysWithOrders = await User.aggregate([
      { $unwind: "$archivedOrders" },
      {
        $match: {
          "archivedOrders.weekStart": new Date(weekStart),
        },
      },
      { $unwind: "$archivedOrders.orders" },
      { $unwind: "$archivedOrders.orders.days" },
      {
        $group: {
          _id: "$archivedOrders.orders.days.day",
        },
      },
      { $project: { _id: 0, day: "$_id" } },
    ]);

    const activeDays = new Set(daysWithOrders.map((d) => d.day));

    // 2. For each active day, get expected counts from archived orders
    const results = await Promise.all(
      DAY_ORDER.filter((day) => activeDays.has(day)).map(async (day) => {
        // Get expected counts
        const expectedItems = await User.aggregate([
          { $unwind: "$archivedOrders" },
          {
            $match: {
              "archivedOrders.weekStart": new Date(weekStart),
            },
          },
          { $unwind: "$archivedOrders.orders" },
          { $unwind: "$archivedOrders.orders.days" },
          { $match: { "archivedOrders.orders.days.day": day } },
          { $unwind: "$archivedOrders.orders.days.meals" },
          {
            $group: {
              _id: "$archivedOrders.orders.days.meals.mealName",
              expectedCount: {
                $sum: {
                  $ifNull: ["$archivedOrders.orders.days.meals.quantity", 1],
                },
              },
            },
          },
          { $project: { _id: 0, mealName: "$_id", expectedCount: 1 } },
        ]);

        // Get saved delivery counts for this specific week + day
        const delivery = await DayDelivery.findOne({
          weekStart: new Date(weekStart),
          day,
        }).lean();

        const deliveryLookup = new Map(
          (delivery?.items || []).map((x) => [x.mealName, x.deliveredCount]),
        );

        const items = expectedItems.map((x) => ({
          mealName: x.mealName,
          expectedCount: x.expectedCount,
          deliveredCount: deliveryLookup.has(x.mealName)
            ? deliveryLookup.get(x.mealName)
            : null,
        }));

        return { day, items };
      }),
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET /api/verify-count-archived error:", error);
    return NextResponse.json(
      { message: "Failed to fetch." },
      { status: 500 },
    );
  }
}