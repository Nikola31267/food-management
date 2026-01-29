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
    enum: ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"],
    required: true,
  },
  meals: [mealSchema],
});

const weeklyOrderSchema = new mongoose.Schema({
  days: [dayOrderSchema],
  totalPrice: {
    type: Number,
    default: 0,
  },
  paid: {
    type: Boolean,
    default: false,
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

  orders: [weeklyOrderSchema],
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
