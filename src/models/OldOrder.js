// models/OldOrder.js
import mongoose from "mongoose";

const oldOrderSchema = new mongoose.Schema(
  {
    menuId: { type: mongoose.Schema.Types.ObjectId, ref: "WeeklyMenu", required: true },

    // Keep week info even after WeeklyMenu is deleted
    weekStart: { type: Date },
    weekEnd: { type: Date },

    // Snapshot of user at the time
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userEmail: { type: String },
    userFullName: { type: String },
    userGrade: { type: String },

    // Snapshot of the order(s) for that menu
    orders: { type: Array, default: [] }, // store raw order objects (days, totals, paid, approvedBy, createdAt)
    total: { type: Number, default: 0 },

    archivedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

oldOrderSchema.index({ menuId: 1, userId: 1 });

export default mongoose.models.OldOrder || mongoose.model("OldOrder", oldOrderSchema);
