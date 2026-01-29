import express from "express";
import User from "../models/User.js";
const router = express.Router();
import jwt from "jsonwebtoken";
import { verifyToken } from "../middleware/auth.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

router.post("/google-signin", async (req, res) => {
  const { token } = req.body;

  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

  if (!token) {
    return res.status(400).json({
      message: "Google token is required",
    });
  }

  try {
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`,
    );

    const { email, name: fullName, email_verified } = response.data;

    if (!email_verified) {
      return res.status(403).json({
        message: "Google email is not verified",
      });
    }

    if (!email.endsWith("@eduiteh.eu")) {
      return res.status(403).json({
        message: "Only @eduiteh.eu emails are allowed",
      });
    }

    let user = await User.findOne({ email });

    const role = email.startsWith("et.") ? "student" : "teacher";
    const grade = role === "teacher" ? "teacher" : undefined;

    if (!user) {
      user = await User.create({
        email,
        fullName,
        role,
        grade,
      });
    }
    const jwtToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
        issuer: "turboverify-token",
      },
    );

    return res.status(200).json({
      message: "Signed in successfully",
      token: jwtToken,
      user,
    });
  } catch (error) {
    console.error("Google sign-in error:", error);

    return res.status(401).json({
      message: "Invalid or expired Google token",
    });
  }
});

router.put("/grade", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { grade } = req.body;

    if (!grade) {
      return res.status(403).json({
        message: "Please select a grade",
      });
    }

    user.grade = grade;
    await user.save();

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

router.get("/user", verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user && user.freeTrialEndsAt && user.freeTrialEndsAt < Date.now()) {
    user.hasAccess = false;
    user.freeTrialEndsAt = null;
    await user.save();
  }

  res.status(200).json(user);
});

export default router;
