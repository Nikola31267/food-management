import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Only admin can access
router.get("/orders", verifyToken, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user.id);

    if (!requestingUser || requestingUser.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    // Fetch all users with their orders
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

export default router;
