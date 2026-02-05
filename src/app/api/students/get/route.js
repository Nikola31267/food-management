// /api/students/get/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";

export async function GET(req) {
  try {
    requireAdmin(req);

    await connectDB();

    const students = await User.find({ role: "student" })
      .select("_id fullName grade email")
      .sort({ fullName: 1 })
      .lean();

    return NextResponse.json(students, { status: 200 });
  } catch (err) {
    const status = err?.status || (err?.message === "Unauthorized" ? 401 : 500);
    const message =
      status === 401
        ? "Unauthorized"
        : status === 403
          ? "Forbidden"
          : "Server error";

    console.error("GET /api/students/get error:", err);
    return NextResponse.json({ message }, { status });
  }
}
