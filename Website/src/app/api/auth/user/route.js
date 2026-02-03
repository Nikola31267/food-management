import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  await connectDB();

  try {
    const decoded = verifyToken(req);
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.freeTrialEndsAt && user.freeTrialEndsAt < Date.now()) {
      user.hasAccess = false;
      user.freeTrialEndsAt = null;
      await user.save();
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
