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
    type: Number,
  },

  orders: [dayOrderSchema],
});

const User = mongoose.model("User", userSchema);

export default User;
