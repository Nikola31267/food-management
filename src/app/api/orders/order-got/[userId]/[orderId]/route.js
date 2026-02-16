import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/models/User";
import { connectDB } from "@/lib/connectDB"; // adjust if your db file is different

export async function PUT(req, { params }) {
  try {
    await connectDB();

    const { userId, orderId } = await params;
    const body = await req.json();
    const { day, orderGot } = body;

    if (!day) {
      return NextResponse.json(
        { message: "Day is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const weekOrder = user.orders.find(
      (o) => String(o._id) === String(orderId)
    );

    if (!weekOrder) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    const dayObj = weekOrder.days.find((d) => d.day === day);

    if (!dayObj) {
      return NextResponse.json(
        { message: "Day not found" },
        { status: 404 }
      );
    }

    dayObj.orderGot = Boolean(orderGot);

    await user.save();

    return NextResponse.json({
      message: "orderGot updated successfully",
      day: dayObj.day,
      orderGot: dayObj.orderGot,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

