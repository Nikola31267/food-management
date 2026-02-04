import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import WeeklyMenu from "@/models/Menu";

export async function DELETE(req, { params }) {
  await connectDB();

  try {
    const decoded = verifyToken(req);
    const user = await User.findById(decoded.id);

    if (user.role !== "admin") {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    const { menuId } = params;
    const url = new URL(req.url);

    const day = url.searchParams.get("day");
    const mealId = url.searchParams.get("mealId");

    const menu = await WeeklyMenu.findByIdAndUpdate(
      menuId,
      {
        $pull: {
          "days.$[d].meals": { _id: mealId },
        },
      },
      {
        arrayFilters: [{ "d.day": day }],
        new: true,
      },
    );

    return NextResponse.json(menu);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
