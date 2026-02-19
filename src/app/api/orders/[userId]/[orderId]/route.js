import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import WeeklyMenu from "@/models/Menu";
import User from "@/models/User";
import Unpaid from "@/models/Unpaid";
import mongoose from "mongoose";

function isOrderPaid(order) {
  if (order?.paid === true) return true;
  if (order?.isPaid === true) return true;
  if (order?.paymentStatus === "paid") return true;
  if (order?.status === "paid") return true;
  return false;
}

export async function DELETE(req, { params }) {
  await connectDB();

  try {
    const decoded = verifyToken(req);
    const adminUser = await User.findById(decoded.id);

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { userId, orderId } = await params;

    const menuIdStr = new URL(req.url).searchParams.get("menuId");
    const menuObjectId =
      menuIdStr && mongoose.Types.ObjectId.isValid(menuIdStr)
        ? new mongoose.Types.ObjectId(menuIdStr)
        : null;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const order = user.orders?.id(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const effectiveMenuId = menuObjectId || order.menuId;

    const menu = effectiveMenuId
      ? await WeeklyMenu.findById(effectiveMenuId).lean()
      : null;

    // --- Build menuDate exactly like the big delete ---
    const menuDate =
      menu?.weekStart && menu?.weekEnd
        ? `${new Date(menu.weekStart).toISOString().slice(0, 10)} - ${new Date(
            menu.weekEnd,
          )
            .toISOString()
            .slice(0, 10)}`
        : menu?.weekStart
          ? new Date(menu.weekStart).toISOString().slice(0, 10)
          : String(effectiveMenuId);

    // --- If unpaid, save to Unpaid like in big delete ---
    const unpaidTotal = !isOrderPaid(order) ? order.totalPrice || 0 : 0;
    console.log(menuDate);

    if (unpaidTotal > 0) {
      await Unpaid.create({
        name: user.fullName || "—",
        grade: user.grade || "—",
        email: user.email || "-",
        total: unpaidTotal,
        week: menuDate,
      });
    }

    // --- Archive the order into user.archivedOrders ---
    user.archivedOrders.push({
      menuId: effectiveMenuId,
      weekStart: menu?.weekStart,
      weekEnd: menu?.weekEnd,
      userEmail: user.email,
      userFullName: user.fullName,
      userGrade: user.grade,
      orders: [order.toObject()],
      total: order.totalPrice || 0,
      archivedAt: new Date(),
    });

    // --- Delete the order ---
    order.deleteOne();
    await user.save();

    return NextResponse.json({
      message: "Order deleted successfully",
      unpaidSaved: unpaidTotal > 0,
      unpaidTotal,
      menuDate,
    });
  } catch (err) {
    console.error("Admin delete order error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete order" },
      { status: 500 },
    );
  }
}
