// /api/students/delete/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(req) {
  try {
    requireAdmin(req);

    await connectDB();

    const body = await req.json().catch(() => null);
    const id = body?.id;

    if (!id) {
      return NextResponse.json(
        { message: "Missing student id" },
        { status: 400 },
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid student id" },
        { status: 400 },
      );
    }

    const student = await User.findOne({ _id: id, role: "student" });
    if (!student) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 },
      );
    }

    await User.deleteOne({ _id: id });

    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (err) {
    const status = err?.status || (err?.message === "Unauthorized" ? 401 : 500);
    const message =
      status === 401
        ? "Unauthorized"
        : status === 403
          ? "Forbidden"
          : "Server error";

    console.error("DELETE /api/students/delete error:", err);
    return NextResponse.json({ message }, { status });
  }
}
