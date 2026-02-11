import { NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();

    const result = await User.aggregate([
      // Only users that have at least 1 order
      { $match: { orders: { $exists: true, $ne: [] } } },

      // Work per-order
      { $unwind: "$orders" },

      {
        $facet: {
          // ✅ ORDER-LEVEL TOTALS (no more unwinds here)
          summary: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },

                paidOrders: {
                  $sum: { $cond: [{ $eq: ["$orders.paid", true] }, 1, 0] },
                },
                unpaidOrders: {
                  $sum: { $cond: [{ $eq: ["$orders.paid", false] }, 1, 0] },
                },

                // Total revenue across ALL orders (guard nulls)
                totalRevenue: {
                  $sum: { $ifNull: ["$orders.totalPrice", 0] },
                },

                // Optional: revenue only from paid orders
                paidRevenue: {
                  $sum: {
                    $cond: [
                      { $eq: ["$orders.paid", true] },
                      { $ifNull: ["$orders.totalPrice", 0] },
                      0,
                    ],
                  },
                },

                // Optional: revenue only from unpaid orders
                unpaidRevenue: {
                  $sum: {
                    $cond: [
                      { $eq: ["$orders.paid", false] },
                      { $ifNull: ["$orders.totalPrice", 0] },
                      0,
                    ],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                totalOrders: 1,
                paidOrders: 1,
                unpaidOrders: 1,
                totalRevenue: 1,
                paidRevenue: 1,
                unpaidRevenue: 1,
              },
            },
          ],

          // ✅ MEAL TOTALS (unwind only inside this facet branch)
          meals: [
            // If some orders don't have days/meals, keep pipeline safe
            {
              $unwind: {
                path: "$orders.days",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $unwind: {
                path: "$orders.days.meals",
                preserveNullAndEmptyArrays: false,
              },
            },

            {
              $group: {
                _id: "$orders.days.meals.mealName",

                quantityOrdered: {
                  $sum: { $ifNull: ["$orders.days.meals.quantity", 0] },
                },

                lineCount: { $sum: 1 },

                // Revenue per meal line: quantity * price (guard nulls)
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
                paidRevenue: 0,
                unpaidRevenue: 0,
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
        paidRevenue: 0,
        unpaidRevenue: 0,
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
