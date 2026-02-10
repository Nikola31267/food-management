import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import TopMeal from "@/models/TopMeal";

export async function POST(req) {
  await connectDB();

  try {
    verifyToken(req);

    const { mealId, mealName, count } = await req.json();

    if (!mealId || !mealName) {
      return NextResponse.json(
        { error: "mealId and mealName are required" },
        { status: 400 },
      );
    }

    const createdOrExisting = await TopMeal.findOneAndUpdate(
      { mealId },
      {
        $setOnInsert: {
          mealId,
          mealName,
          count: typeof count === "number" ? count : 1,
        },
      },
      { upsert: true, new: true },
    );

    return NextResponse.json(createdOrExisting, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create meal stat" },
      { status: 500 },
    );
  }
}

/**
 * PUT: increment existing meal by 1 (or by quantity if provided)
 * Body: { mealId: string, quantity?: number, mealName?: string }
 */
export async function PUT(req) {
  await connectDB();

  try {
    verifyToken(req);

    const { mealId, quantity, mealName } = await req.json();
    const incBy = typeof quantity === "number" ? quantity : 1;

    if (!mealId) {
      return NextResponse.json(
        { error: "mealId is required" },
        { status: 400 },
      );
    }

    const updated = await TopMeal.findOneAndUpdate(
      { mealId },
      {
        $inc: { count: incBy },
        ...(mealName ? { $set: { mealName } } : {}),
      },
      { new: true },
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Meal not found. Call POST first to create it." },
        { status: 404 },
      );
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update meal stat" },
      { status: 500 },
    );
  }
}

/**
 * GET: top 5 most ordered
 * Response: [{ mealId, mealName, count }]
 */
export async function GET(req) {
  await connectDB();

  try {
    verifyToken(req);

    const top5 = await TopMeal.find({})
      .sort({ count: -1, updatedAt: -1 })
      .limit(5)
      .select("mealId mealName count")
      .lean();

    return NextResponse.json(top5, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch top meals" },
      { status: 500 },
    );
  }
}
