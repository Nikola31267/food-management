"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import Loader from "@/components/layout/Loader";
import Link from "next/link";

const AdminOrdersPage = () => {
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axiosInstance.get("/admin/orders", {
          headers: {
            "x-auth-token": localStorage.getItem("data-traffic-auth"),
          },
        });
        setOrdersData(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="p-8 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">All Users Orders</h1>
      <Link href="/admin">Back</Link>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {ordersData.length === 0 ? (
        <p>No orders submitted yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Name</th>
                <th className="border p-2">Grade</th>
                <th className="border p-2">Orders</th>
                <th className="border p-2">Total Price</th>
              </tr>
            </thead>
            <tbody>
              {ordersData.map((user) => (
                <tr key={user._id} className="border-b">
                  <td className="border p-2">{user.fullName}</td>
                  <td className="border p-2">{user.grade}</td>
                  <td className="border p-2">
                    {user.orders.map((week, idx) => (
                      <div key={idx} className="mb-4">
                        {week.days.map((day) => (
                          <div key={day.day} className="mb-2">
                            <strong>{day.day}:</strong>
                            <ul className="ml-4">
                              {day.meals.map((meal) => (
                                <li key={meal.mealName}>
                                  {meal.mealName} x {meal.quantity} = $
                                  {meal.price * meal.quantity}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ))}
                  </td>
                  <td className="border p-2 font-bold">
                    ${user.orders.reduce((sum, w) => sum + w.totalPrice, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
