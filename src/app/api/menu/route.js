import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import WeeklyMenu from "@/models/Menu";
import Unpaid from "@/models/Unpaid";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

function isOrderPaid(order) {
    if (order?.paid === true) return true;
    return false;
}

async function deleteMenuAndArchive(menuId) {
    const menu = await WeeklyMenu.findById(menuId).lean();
    if (!menu) return;

    const menuObjectId = new mongoose.Types.ObjectId(menuId);

    const usersWithOrders = await User.find(
        { "orders.menuId": menuObjectId },
        { email: 1, fullName: 1, grade: 1, orders: 1 },
    ).lean();

    const menuDate =
        menu.weekStart && menu.weekEnd
            ? `${new Date(menu.weekStart).toISOString().slice(0, 10)} - ${new Date(menu.weekEnd).toISOString().slice(0, 10)}`
            : menu.weekStart
              ? new Date(menu.weekStart).toISOString().slice(0, 10)
              : String(menuId);

    const bulkOps = [];
    const unpaidDocs = [];

    usersWithOrders.forEach((u) => {
        const matchingOrders = (u.orders || []).filter(
            (o) => o.menuId?.toString() === menuId,
        );

        if (!matchingOrders.length) return;

        const total = matchingOrders.reduce(
            (sum, o) => sum + (o.totalPrice || 0),
            0,
        );

        const archiveDoc = {
            menuId: menuObjectId,
            weekStart: menu.weekStart,
            weekEnd: menu.weekEnd,
            userEmail: u.email,
            userFullName: u.fullName,
            userGrade: u.grade,
            orders: matchingOrders,
            total,
            archivedAt: new Date(),
        };

        bulkOps.push({
            updateOne: {
                filter: { _id: u._id },
                update: {
                    $push: { archivedOrders: archiveDoc },
                    $pull: { orders: { menuId: menuObjectId } },
                },
            },
        });

        const unpaidTotal = matchingOrders
            .filter((o) => !isOrderPaid(o))
            .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

        if (unpaidTotal > 0) {
            unpaidDocs.push({
                name: u.fullName || "—",
                grade: u.grade || "—",
                total: unpaidTotal,
                week: menuDate,
                email: u.email || "—",
            });
        }
    });

    if (bulkOps.length) {
        await User.bulkWrite(bulkOps, { ordered: false });
    }

    if (unpaidDocs.length) {
        await Unpaid.insertMany(unpaidDocs, { ordered: false });
    }

    await WeeklyMenu.findByIdAndDelete(menuId);
}

export async function POST(req) {
    await connectDB();

    try {
        const decoded = await verifyToken(req);
        const user = await User.findById(decoded.id);

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 },
            );
        }

        if (user.role !== "admin") {
            return NextResponse.json(
                { message: "You are not admin" },
                { status: 403 },
            );
        }

        const {
            weekStart,
            weekEnd,
            days,
            orderDeadline,
            menuFile,
            menuFileName,
        } = await req.json();

        if (!orderDeadline) {
            return NextResponse.json(
                { message: "Order deadline is required" },
                { status: 400 },
            );
        }

        const deadlineDate = new Date(orderDeadline);

        if (isNaN(deadlineDate.getTime())) {
            return NextResponse.json(
                { message: "Invalid order deadline" },
                { status: 400 },
            );
        }

        /**
         * Before creating a new menu:
         * 1. Find all existing menus
         * 2. Archive their orders
         * 3. Save unpaid totals
         * 4. Delete old menus
         */
        const existingMenus = await WeeklyMenu.find({}, { _id: 1 }).lean();

        for (const existing of existingMenus) {
            await deleteMenuAndArchive(existing._id.toString());
        }

        const menu = await WeeklyMenu.create({
            weekStart,
            weekEnd,
            orderDeadline: deadlineDate,
            days,
            menuFile: menuFile || "",
            menuFileName: menuFileName || "",
        });

        return NextResponse.json(menu, { status: 201 });
    } catch (err) {
        console.error("POST /api/menu error:", err);

        return NextResponse.json(
            { message: err.message || "Something went wrong" },
            { status: 500 },
        );
    }
}

export async function GET() {
    await connectDB();

    try {
        const menu = await WeeklyMenu.findOne().sort({ createdAt: -1 }).lean();
        return NextResponse.json(menu);
    } catch (err) {
        console.error("GET /api/menu error:", err);

        return NextResponse.json(
            { message: err.message || "Something went wrong" },
            { status: 500 },
        );
    }
}