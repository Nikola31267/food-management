import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
  name: String,
  price: Number,
});

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

const DailyMenu = mongoose.model("DailyMenu", dailyMenuSchema);

export default DailyMenu;
