import express from "express";
import User from "../models/User.js";
const router = express.Router();
import { verifyToken } from "../middleware/auth.js";
import dotenv from "dotenv";

import WeeklyMenu from "../models/Menu.js";

dotenv.config();

router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { weeklyOrder } = req.body;

    const user = await User.findById(userId);

    const menu = await WeeklyMenu.findOne().sort({ createdAt: -1 });
    if (!menu) return res.status(400).json({ error: "No active menu" });

    const now = new Date();
    if (now > menu.orderDeadline)
      return res.status(403).json({ error: "Ordering deadline has passed" });

    const existingOrder = user.orders.find(
      (order) => order.menuId?.toString() === menu._id.toString(),
    );
    if (existingOrder)
      return res
        .status(400)
        .json({ error: "User has already submitted an order" });

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

      weeklyOrderObj.days.push({ day, meals: dayMeals });
    }

    user.orders.push(weeklyOrderObj);
    await user.save();

    res.status(200).json({
      message: "Order saved successfully",
      totalPrice: weeklyOrderObj.totalPrice,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save order" });
  }
});

export default router;
