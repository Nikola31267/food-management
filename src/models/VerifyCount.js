import mongoose from "mongoose";

const deliveredItemSchema = new mongoose.Schema(
  {
    mealName: { type: String, required: true },
    expectedCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
  },
  { _id: false },
);

const dayDeliverySchema = new mongoose.Schema(
  {
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WeeklyMenu",
      required: true,
      index: true,
    },
    day: {
      type: String,
      enum: ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"],
      required: true,
      index: true,
    },
    items: { type: [deliveredItemSchema], default: [] },
  },
  { timestamps: true },
);

dayDeliverySchema.index({ menuId: 1, day: 1 }, { unique: true });

const DayDelivery =
  mongoose.models.DayDelivery ||
  mongoose.model("DayDelivery", dayDeliverySchema);

export default DayDelivery;
