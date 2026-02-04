import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

export async function PUT(req) {
  await connectDB();

  try {
    const decoded = verifyToken(req);
    const { grade } = await req.json();

    if (!grade) {
      return NextResponse.json(
        { message: "Please select a grade" },
        { status: 403 },
      );
    }

    const user = await User.findById(decoded.id);

    user.grade = grade;
    await user.save();

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
