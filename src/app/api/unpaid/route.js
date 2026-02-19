import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";
import Unpaid from "@/models/Unpaid";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  await connectDB();

  try {
    const decoded = verifyToken(req);
    const userId = decoded.id;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Not an admin user" }, { status: 403 });
    }

    const unpaidOrders = await Unpaid.find().sort({ createdAt: -1 });

    return NextResponse.json(unpaidOrders, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch unpaid orders" },
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
  await connectDB();

  try {
    const decoded = verifyToken(req);
    const userId = decoded.id;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Not an admin user" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const deleted = await Unpaid.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete unpaid order" },
      { status: 500 },
    );
  }
}
