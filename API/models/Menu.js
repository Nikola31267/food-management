import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
  name: String,
  price: Number,
});

const daySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"],
    required: true,
  },
  meals: {
    type: [mealSchema],
    default: [],
  },
});

const weeklyMenuSchema = new mongoose.Schema(
  {
    weekStart: {
      type: Date,
      required: true,
    },
    weekEnd: {
      type: Date,
      required: true,
    },
    days: {
      type: [daySchema],
      default: [],
    },
  },
  { timestamps: true },
);

export default mongoose.model("WeeklyMenu", weeklyMenuSchema);
