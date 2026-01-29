import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/orders", verifyToken, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user.id);

    if (!requestingUser || requestingUser.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const users = await User.find(
      { orders: { $exists: true, $ne: [] } },
      "fullName grade orders",
    ).lean();

    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.put("/orders/paid/:userId/:orderId", verifyToken, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser || requestingUser.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { userId, orderId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const order = user.orders.id(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.paid = true;
    await user.save();

    res.status(200).json({ message: "Order marked as paid", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update order" });
  }
});

router.delete("/orders/:userId/:orderId", verifyToken, async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { userId, orderId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.orders = user.orders.filter((o) => o._id.toString() !== orderId);
    await user.save();

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete order" });
  }
});
export default router;
