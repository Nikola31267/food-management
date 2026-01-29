import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
  name: String,
  price: Number,
});

const dayOrder = {
  Понеделник: 1,
  Вторник: 2,
  Сряда: 3,
  Четвъртък: 4,
  Петък: 5,
};

const dailyMenuSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      enum: ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"],
    },

    dayIndex: {
      type: Number,
      required: true,
    },

    meals: {
      type: [mealSchema],
      default: [],
    },
  },
  { timestamps: true },
);

//
// 🔥 Automatically set correct day order
//
dailyMenuSchema.pre("validate", function (next) {
  this.dayIndex = dayOrder[this.day];
  next();
});

const DailyMenu = mongoose.model("DailyMenu", dailyMenuSchema);

export default DailyMenu;
