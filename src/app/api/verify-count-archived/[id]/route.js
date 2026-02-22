import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import DayDelivery from "@/models/VerifyCount";

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

    const { id: day } = await params; // ✅ matches the [id] folder name
    const { searchParams } = new URL(req.url);
    const weekStart = searchParams.get("weekStart");

    console.log("day value:", day); // should now show Понеделник

    if (!weekStart) {
      return NextResponse.json(
        { message: "weekStart is required" },
        { status: 400 },
      );
    }

    const { items } = await req.json();
    const start = new Date(weekStart);

    const result = await DayDelivery.findOneAndUpdate(
      { weekStart: start, day },
      {
        $set: {
          weekStart: start,
          day,
          items: items.map((x) => ({
            mealName: x.mealName,
            expectedCount: x.expectedCount ?? 0,
            deliveredCount: x.deliveredCount ?? 0,
          })),
        },
      },
      { upsert: true, new: true },
    );

    console.log("Saved result:", JSON.stringify(result));

    return NextResponse.json({ message: "Saved successfully" });
  } catch (err) {
    console.error("PUT /api/verify-count-archived/[id] error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
