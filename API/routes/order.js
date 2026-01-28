import express from "express";
import User from "../models/User.js";
const router = express.Router();
import jwt from "jsonwebtoken";
import { verifyToken } from "../middleware/auth.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { weeklyOrder, totalPrice } = req.body;

    const user = await User.findById(userId);

    if (user.orders && user.orders.length > 0) {
      return res
        .status(400)
        .json({ error: "User has already submitted an order" });
    }

    const weeklyOrderObj = {
      days: [],
      totalPrice: totalPrice,
      paid: false,
    };

    for (const day in weeklyOrder) {
      const dayMeals = weeklyOrder[day].map((m) => ({
        mealName: m.name,
        quantity: m.quantity,
        price: m.price,
      }));

      weeklyOrderObj.days.push({
        day,
        meals: dayMeals,
      });
    }

    user.orders.push(weeklyOrderObj);
    await user.save();

    res.status(200).json({ message: "Order saved", totalPrice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save order" });
  }
});

export default router;
