import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import OldOrder from "@/models/OldOrder";
import WeeklyMenu from "@/models/Menu";
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
    const menuId = new URL(req.url).searchParams.get("menuId");
    console.log(menuId);

    const user = await User.findById(userId);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const menu = await WeeklyMenu.findById(menuId).lean();
    if (!menu) {
      return NextResponse.json({ message: "Menu not found" }, { status: 404 });
    }

    const usersWithOrders = await User.find(
      { "orders.menuId": menuId },
      { email: 1, fullName: 1, grade: 1, orders: 1 },
    ).lean();

    const archiveDocs = usersWithOrders.map((u) => {
      const matchingOrders = u.orders.filter(
        (o) => o.menuId.toString() === menuId,
      );

      const total = matchingOrders.reduce(
        (sum, o) => sum + (o.totalPrice || 0),
        0,
      );

      return {
        menuId,
        weekStart: menu.weekStart,
        weekEnd: menu.weekEnd,
        userId: u._id,
        userEmail: u.email,
        userFullName: u.fullName,
        userGrade: u.grade,
        orders: matchingOrders,
        total,
        archivedAt: new Date(),
      };
    });

    if (archiveDocs.length) {
      await OldOrder.insertMany(archiveDocs, { ordered: false });
    }

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
