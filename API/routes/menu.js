import express from "express";
import User from "../models/User.js";
import WeeklyMenu from "../models/Menu.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// ================= CREATE / UPDATE WEEK =================
router.post("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.role !== "admin") {
      return res.status(403).json({ message: "You are not admin" });
    }

    const { weekStart, weekEnd, days } = req.body;

    const menu = await WeeklyMenu.findOneAndUpdate(
      { weekStart, weekEnd },
      { weekStart, weekEnd, days },
      { new: true, upsert: true },
    );

    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= GET CURRENT WEEK =================
router.get("/", async (req, res) => {
  try {
    const menu = await WeeklyMenu.findOne().sort({ createdAt: -1 });
    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= DELETE SINGLE MEAL =================
router.delete("/:menuId/:day/:mealId", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { menuId, day, mealId } = req.params;

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

    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= DELETE WHOLE MENU =================
router.delete("/:menuId", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await WeeklyMenu.findByIdAndDelete(req.params.menuId);

    res.json({ message: "Weekly menu deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
