import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import DayDelivery from "@/models/VerifyCount";

const DAY_ORDER = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"];

export async function GET(req) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await User.findById(decoded.id);
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const weekStart = searchParams.get("weekStart");
    const weekEnd = searchParams.get("weekEnd");

    if (!weekStart || !weekEnd) {
      return NextResponse.json(
        { message: "weekStart and weekEnd are required" },
        { status: 400 },
      );
    }

    const start = new Date(weekStart);
    const end = new Date(weekEnd);

    // Get all users that have archivedOrders for this week
    const users = await User.find({
      "archivedOrders.weekStart": start,
      "archivedOrders.weekEnd": end,
    }).lean();

    // Build expected counts from archivedOrders
    const dayMealMap = {};
    DAY_ORDER.forEach((d) => (dayMealMap[d] = {}));

    users.forEach((user) => {
      user.archivedOrders
        .filter(
          (ao) =>
            new Date(ao.weekStart).toISOString() === start.toISOString() &&
            new Date(ao.weekEnd).toISOString() === end.toISOString(),
        )
        .forEach((archivedOrder) => {
          (archivedOrder.orders ?? []).forEach((weeklyOrder) => {
            (weeklyOrder.days ?? []).forEach((dayEntry) => {
              const dayName = dayEntry.day;
              if (!dayMealMap[dayName]) return;
              (dayEntry.meals ?? []).forEach((meal) => {
                if (!meal.mealName) return;
                dayMealMap[dayName][meal.mealName] =
                  (dayMealMap[dayName][meal.mealName] || 0) +
                  (meal.quantity || 1);
              });
            });
          });
        });
    });

    // Get delivered counts from DayDelivery using weekStart as the key
    const deliveries = await DayDelivery.find({
      weekStart: start,
    }).lean();

    const deliveredByDay = new Map(
      deliveries.map((d) => [d.day, d.items || []]),
    );

    // Merge expected + delivered
    const merged = DAY_ORDER.map((day) => {
      const mealsMap = dayMealMap[day] || {};
      const deliveredItems = deliveredByDay.get(day) || [];
      const deliveredLookup = new Map(
        deliveredItems.map((x) => [x.mealName, x.deliveredCount]),
      );

      const items = Object.entries(mealsMap)
        .sort(([a], [b]) => a.localeCompare(b, "bg"))
        .map(([mealName, expectedCount]) => ({
          mealName,
          expectedCount,
          deliveredCount: deliveredLookup.get(mealName) ?? null,
        }));

      return { day, items };
    });

    return NextResponse.json(merged);
  } catch (err) {
    console.error("GET /api/verify-count-archived error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
