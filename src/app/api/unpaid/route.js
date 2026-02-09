import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";
import Unpaid from "@/models/Unpaid";

export async function POST(req) {
  await connectDB();

  try {
    const decoded = verifyToken(req);
    const userId = decoded.id;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role != "admin") {
      return NextResponse.json({ error: "Not an admin user" }, { status: 403 });
    }

    const { name, grade, total, menuDate } = await req.json();

    const unpaid = await Unpaid.create({
      name,
      grade,
      total,
      menuDate,
    });

    return NextResponse.json(unpaid, { status: 201 });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to save order" },
      { status: 500 },
    );
  }
}
