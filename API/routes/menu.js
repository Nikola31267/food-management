import express from "express";
import User from "../models/User.js";
import WeeklyMenu from "../models/Menu.js";
import { verifyToken } from "../middleware/auth.js";
import { Parser } from "json2csv";

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

    const { menuId } = req.params;
    const download = req.query.download === "true";

    const usersWithOrders = await User.find(
      { "orders.menuId": menuId },
      { fullName: 1, grade: 1, orders: 1 },
    );

    let csv;

    if (download) {
      const rows = [];

      usersWithOrders.forEach((user) => {
        const row = {
          Name: user.fullName || "—",
          Grade: user.grade || "—",
          Понеделник: "—",
          Вторник: "—",
          Сряда: "—",
          Четвъртък: "—",
          Петък: "—",
          Total: 0,
        };

        user.orders
          .filter((o) => o.menuId.toString() === menuId)
          .forEach((order) => {
            row.Total += order.totalPrice || 0;

            order.days.forEach((day) => {
              const mealsText = day.meals
                .map((m) => `${m.mealName} x${m.quantity}`)
                .join(", ");

              row[day.day] = mealsText || "—";
            });
          });

        rows.push(row);
      });

      const parser = new Parser({
        fields: [
          "Name",
          "Grade",
          "Понеделник",
          "Вторник",
          "Сряда",
          "Четвъртък",
          "Петък",
          "Total",
        ],
      });

      csv = parser.parse(rows);
    }

    await WeeklyMenu.findByIdAndDelete(menuId);

    await User.updateMany({}, { $pull: { orders: { menuId } } });

    if (download) {
      res.header("Content-Type", "text/csv");
      res.attachment(`orders-${menuId}.csv`);
      return res.send(csv);
    }

    res.json({ message: "Weekly menu and orders deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
