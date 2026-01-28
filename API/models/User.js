import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
  mealName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
  price: {
    type: Number,
  },
});

const dayOrderSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    required: true,
  },
  meals: [mealSchema],
});

// New schema for a weekly order
const weeklyOrderSchema = new mongoose.Schema({
  days: [dayOrderSchema], // all days in this weekly order
  totalPrice: {
    type: Number,
    default: 0, // total sum for this weekly order
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },

  fullName: {
    type: String,
  },

  role: {
    type: String,
    default: "student",
  },
  grade: {
    type: String,
  },

  orders: [weeklyOrderSchema], // now each order contains days + totalPrice
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
