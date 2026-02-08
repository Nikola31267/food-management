import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";
import OldOrder from "@/models/OldOrder";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  await connectDB();

  try {
    const decoded = verifyToken(req);
    const me = await User.findById(decoded.id).lean();

    if (!me) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const filter = { userId: me._id };

    if (from || to) {
      filter.weekStart = {};
      if (from) filter.weekStart.$gte = new Date(from);
      if (to) filter.weekStart.$lte = new Date(to);
    }

    const oldOrders = await OldOrder.find(filter)
      .sort({ weekStart: -1, archivedAt: -1 })
      .lean();

    return NextResponse.json({ oldOrders });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
