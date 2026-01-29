"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import Loader from "@/components/layout/Loader";
import Link from "next/link";
import { useRouter } from "next/navigation";

const AdminOrdersPage = () => {
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (localStorage.getItem("data-traffic-auth")) {
        try {
          const response = await axiosInstance.get("/auth/user", {
            headers: {
              "x-auth-token": localStorage.getItem("data-traffic-auth"),
            },
          });
          if (response.data.role != "admin") {
            router.push("/dashboard");
          }
        } catch (error) {
          setError("Error fetching user profile");
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setUser(null);
        router.push("/sign-in");
      }
    };

    fetchUserProfile();
  }, [router]);

  const downloadFoodByClassCSV = () => {
    const classFoodMap = {};

    ordersData.forEach((user) => {
      const grade = user.grade;

      if (!classFoodMap[grade]) {
        classFoodMap[grade] = {};
      }

      user.orders.forEach((week) => {
        week.days.forEach((day) => {
          day.meals.forEach((meal) => {
            if (!classFoodMap[grade][meal.mealName]) {
              classFoodMap[grade][meal.mealName] = 0;
            }

            classFoodMap[grade][meal.mealName] += meal.quantity;
          });
        });
      });
    });
    const rows = [];
    rows.push(["Class", "Meal", "Total Quantity"]);

    Object.entries(classFoodMap).forEach(([grade, meals]) => {
      Object.entries(meals).forEach(([mealName, quantity]) => {
        rows.push([grade, mealName, quantity]);
      });
    });

    const csvContent = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "food-by-class.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const fetchOrders = async () => {
    try {
      const res = await axiosInstance.get("/admin/orders", {
        headers: { "x-auth-token": localStorage.getItem("data-traffic-auth") },
      });
      setOrdersData(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const markAsPaid = async (userId, orderId) => {
    try {
      await axiosInstance.put(
        `/admin/orders/paid/${userId}/${orderId}`,
        {},
        {
          headers: {
            "x-auth-token": localStorage.getItem("data-traffic-auth"),
          },
        },
      );
      alert("Order marked as paid ✅");
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to mark order as paid ❌");
    }
  };

  const deleteOrder = async (userId, orderId) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      await axiosInstance.delete(`/admin/orders/${userId}/${orderId}`, {
        headers: {
          "x-auth-token": localStorage.getItem("data-traffic-auth"),
        },
      });
      alert("Order deleted successfully 🗑️");
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to delete order ❌");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-8 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">All Users Orders</h1>

      <div className="flex gap-4 mb-4">
        <Link href="/admin" className="text-blue-600 underline">
          Back
        </Link>

        <button
          onClick={downloadFoodByClassCSV}
          className=" bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Export Food by Class
        </button>
      </div>

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
                <th className="border p-2">Paid</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ordersData.map((user) =>
                user.orders.map((week) => (
                  <tr key={`${user._id}-${week._id}`} className="border-b">
                    <td className="border p-2">{user.fullName}</td>
                    <td className="border p-2">{user.grade}</td>
                    <td className="border p-2">
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
                    </td>
                    <td className="border p-2 font-bold">${week.totalPrice}</td>
                    <td className="border p-2 text-center">
                      {week.paid ? (
                        <span className="text-green-600 font-bold">Paid</span>
                      ) : (
                        <button
                          onClick={() => markAsPaid(user._id, week._id)}
                          className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Mark as Paid
                        </button>
                      )}
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => deleteOrder(user._id, week._id)}
                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
