import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();

    const result = await User.aggregate([
      { $match: { orders: { $exists: true, $ne: [] } } },

      { $unwind: "$orders" },

      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                paidOrders: {
                  $sum: {
                    $cond: [{ $eq: ["$orders.paid", true] }, 1, 0],
                  },
                },
                unpaidOrders: {
                  $sum: {
                    $cond: [{ $eq: ["$orders.paid", false] }, 1, 0],
                  },
                },
                totalRevenue: { $sum: "$orders.totalPrice" },
              },
            },
            {
              $project: {
                _id: 0,
                totalOrders: 1,
                paidOrders: 1,
                unpaidOrders: 1,
                totalRevenue: 1,
              },
            },
          ],

          meals: [
            { $unwind: "$orders.days" },
            { $unwind: "$orders.days.meals" },
            {
              $group: {
                _id: "$orders.days.meals.mealName",

                // total quantity ordered per meal
                quantityOrdered: {
                  $sum: "$orders.days.meals.quantity",
                },

                // how many order lines contain this meal
                lineCount: { $sum: 1 },

                // optional revenue per meal
                revenue: {
                  $sum: {
                    $multiply: [
                      { $ifNull: ["$orders.days.meals.quantity", 0] },
                      { $ifNull: ["$orders.days.meals.price", 0] },
                    ],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                mealName: "$_id",
                quantityOrdered: 1,
                lineCount: 1,
                revenue: 1,
              },
            },
            { $sort: { quantityOrdered: -1, mealName: 1 } },
          ],
        },
      },

      {
        $project: {
          summary: {
            $ifNull: [
              { $arrayElemAt: ["$summary", 0] },
              {
                totalOrders: 0,
                paidOrders: 0,
                unpaidOrders: 0,
                totalRevenue: 0,
              },
            ],
          },
          meals: 1,
        },
      },
    ]);

    const data = result[0] || {
      summary: {
        totalOrders: 0,
        paidOrders: 0,
        unpaidOrders: 0,
        totalRevenue: 0,
      },
      meals: [],
    };

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GET /api/orders/stats error:", error);
    return NextResponse.json(
      { message: "Failed to load order stats" },
      { status: 500 },
    );
  }
}
