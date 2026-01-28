import express from "express";
import User from "../models/User.js";
const router = express.Router();
import jwt from "jsonwebtoken";
import { verifyToken } from "../middleware/auth.js";
import axios from "axios";
import dotenv from "dotenv";
import DailyMenu from "../models/Menu.js";

dotenv.config();

router.post("/menu", verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  const menu = await DailyMenu.create(req.body);

  if (user.role === "admin") {
    res.json(menu);
  } else {
    res.status(200).json({
      message: "You are not admin you cant edit the menu",
    });
  }
});

export default router;
