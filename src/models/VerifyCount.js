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
      default: null,
    },
    weekStart: {
      type: Date,
      default: null,
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

dayDeliverySchema.index({ menuId: 1, day: 1 }, { unique: false });
dayDeliverySchema.index({ weekStart: 1, day: 1 }, { unique: false });

// ✅ Clear cached model so schema changes take effect
delete mongoose.models.DayDelivery;

const DayDelivery = mongoose.model("DayDelivery", dayDeliverySchema);

export default DayDelivery;
