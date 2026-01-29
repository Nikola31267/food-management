import express from "express";
import User from "../models/User.js";
import DailyMenu from "../models/Menu.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

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
      { day },
      {
        $push: { meals: { $each: meals } },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    res.status(200).json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const menus = await DailyMenu.find().sort({ dayIndex: 1 });
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
