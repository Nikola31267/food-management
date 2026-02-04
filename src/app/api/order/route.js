import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import WeeklyMenu from "@/models/Menu";

export async function POST(req) {
  await connectDB();

  try {
    const decoded = verifyToken(req);
    const userId = decoded.id;

    const { weeklyOrder } = await req.json();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const menu = await WeeklyMenu.findOne().sort({ createdAt: -1 });

    if (!menu) {
      return NextResponse.json({ error: "No active menu" }, { status: 400 });
    }

    const now = new Date();
    if (now > menu.orderDeadline) {
      return NextResponse.json(
        { error: "Ordering deadline has passed" },
        { status: 403 },
      );
    }

    const existingOrder = user.orders.find(
      (order) => order.menuId?.toString() === menu._id.toString(),
    );

    if (existingOrder) {
      return NextResponse.json(
        { error: "User has already submitted an order" },
        { status: 400 },
      );
    }

    const weeklyOrderObj = {
      menuId: menu._id,
      days: [],
      totalPrice: 0,
      paid: false,
    };

    const dayOrder = {
      Понеделник: 1,
      Вторник: 2,
      Сряда: 3,
      Четвъртък: 4,
      Петък: 5,
    };

    const orderedDays = Object.keys(weeklyOrder).sort(
      (a, b) => dayOrder[a] - dayOrder[b],
    );

    for (const day of orderedDays) {
      const dayMeals = weeklyOrder[day].map((m) => ({
        mealName: m.name,
        mealId: m.mealId,
        quantity: m.quantity,
        price: m.price,
      }));

      const dayTotal = dayMeals.reduce(
        (sum, m) => sum + m.price * m.quantity,
        0,
      );

      weeklyOrderObj.totalPrice += dayTotal;

      weeklyOrderObj.days.push({
        day,
        meals: dayMeals,
      });
    }

    user.orders.push(weeklyOrderObj);
    await user.save();

    return NextResponse.json({
      message: "Order saved successfully",
      totalPrice: weeklyOrderObj.totalPrice,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to save order" },
      { status: 500 },
    );
  }
}
