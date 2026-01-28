import express from "express";
import User from "../models/User.js";
const router = express.Router();
import { verifyToken } from "../middleware/auth.js";
import axios from "axios";
import dotenv from "dotenv";
import DailyMenu from "../models/Menu.js";

dotenv.config();

router.post("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "You are not admin",
      });
    }

    const { day, meals } = req.body;

    const menu = await DailyMenu.findOneAndUpdate(
      { day }, // find Monday
      {
        $push: { meals: { $each: meals } },
      },
      {
        new: true,
        upsert: true,
      },
    );

    res.status(200).json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const menus = await DailyMenu.find().sort({ day: 1 });
    res.json(menus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:day/:mealId", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { day, mealId } = req.params;

    const menu = await DailyMenu.findOneAndUpdate(
      { day },
      {
        $pull: {
          meals: { _id: mealId },
        },
      },
      { new: true },
    );

    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
