import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import DayDelivery from "@/models/VerifyCount";

const DAY_ORDER = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"];

async function getExpectedForDay(menuId, day) {
  const mid = new mongoose.Types.ObjectId(menuId);

  const rows = await User.aggregate([
    { $unwind: "$orders" },
    { $match: { "orders.menuId": mid } },
    { $unwind: "$orders.days" },
    { $match: { "orders.days.day": day } },
    { $unwind: "$orders.days.meals" },
    {
      $group: {
        _id: "$orders.days.meals.mealName",
        expectedCount: {
          $sum: { $ifNull: ["$orders.days.meals.quantity", 1] },
        },
      },
    },
    { $project: { _id: 0, mealName: "$_id", expectedCount: 1 } },
  ]);

  return rows;
}

export async function PUT(req, { params }) {
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

    const day = params?.day;
    if (!DAY_ORDER.includes(day)) {
      return NextResponse.json({ message: "Invalid day" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const menuId = searchParams.get("menuId");
    if (!menuId) {
      return NextResponse.json(
        { message: "menuId is required" },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.items)) {
      return NextResponse.json(
        { message: "Body must include items[]" },
        { status: 400 },
      );
    }

    const expectedItems = await getExpectedForDay(menuId, day);
    const expectedLookup = new Map(
      expectedItems.map((x) => [x.mealName, x.expectedCount]),
    );

    const normalizedItems = body.items.map((x) => ({
      mealName: String(x.mealName),
      expectedCount: expectedLookup.get(String(x.mealName)) ?? 0,
      deliveredCount: Number(x.deliveredCount ?? 0),
    }));

    const doc = await DayDelivery.findOneAndUpdate(
      { menuId, day },
      { $set: { items: normalizedItems } },
      { new: true, upsert: true },
    ).lean();

    return NextResponse.json(doc);
  } catch (err) {
    console.error("PUT /api/daily-orders/[day] error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
