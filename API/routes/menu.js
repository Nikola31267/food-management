import express from "express";
import User from "../models/User.js";
import WeeklyMenu from "../models/Menu.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== "admin") {
      return res.status(403).json({ message: "You are not admin" });
    }

    const { weekStart, weekEnd, days, orderDeadline } = req.body;

    if (!orderDeadline) {
      return res.status(400).json({ message: "Order deadline is required" });
    }

    const deadlineDate = new Date(orderDeadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ message: "Invalid order deadline" });
    }

    const menu = await WeeklyMenu.create({
      weekStart,
      weekEnd,
      orderDeadline: deadlineDate,
      days,
    });

    res.status(201).json(menu);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.put("/:menuId", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { weekStart, weekEnd, days, orderDeadline } = req.body;

    if (!orderDeadline) {
      return res.status(400).json({ message: "Order deadline is required" });
    }

    const deadlineDate = new Date(orderDeadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ message: "Invalid order deadline" });
    }

    const updatedMenu = await WeeklyMenu.findByIdAndUpdate(
      req.params.menuId,
      {
        weekStart,
        weekEnd,
        orderDeadline: deadlineDate,
        days,
      },
      { new: true },
    );

    if (!updatedMenu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    res.json(updatedMenu);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const menu = await WeeklyMenu.findOne().sort({ createdAt: -1 });
    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

router.delete("/:menuId", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const menuId = req.params.menuId;

    // Delete the menu
    await WeeklyMenu.findByIdAndDelete(menuId);

    // Remove all orders linked to this menu from all users
    await User.updateMany({}, { $pull: { orders: { menuId: menuId } } });

    res.json({ message: "Weekly menu and all related orders deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
