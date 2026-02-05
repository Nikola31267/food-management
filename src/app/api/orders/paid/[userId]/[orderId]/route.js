import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";

export async function PUT(req, { params }) {
  await connectDB();

  try {
    const decoded = verifyToken(req);
    const adminUser = await User.findById(decoded.id);

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { userId, orderId } = params;
    const user = await User.findById(userId);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const order = user.orders.id(orderId);
    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    order.paid = true;
    order.approvedBy = adminUser._id;
    await user.save();

    return NextResponse.json({
      message: "Order marked as paid",
      order,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
}
