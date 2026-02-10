import mongoose from "mongoose";

const TopMealSchema = new mongoose.Schema(
  {
    mealId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    mealName: { type: String, required: true },
    count: { type: Number, default: 1, min: 0, index: true },
  },
  { timestamps: true },
);

export default mongoose.models.TopMeal ||
  mongoose.model("TopMeal", TopMealSchema);
