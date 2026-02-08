import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";

export async function DELETE(req, { params }) {
  await connectDB();

  try {
    const decoded = verifyToken(req);
    const adminUser = await User.findById(decoded.id);

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { userId, orderId } = await params;
    const user = await User.findById(userId);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    user.orders = user.orders.filter((o) => o._id.toString() !== orderId);
    await user.save();

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 },
    );
  }
}
