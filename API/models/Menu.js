import mongoose from "mongoose";
const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    price: Number,
    image: String,
  },
  { _id: false },
);

const dailyMenuSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },

    meals: {
      type: [mealSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DailyMenu", dailyMenuSchema);
