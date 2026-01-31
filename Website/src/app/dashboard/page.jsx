"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import Loader from "@/components/layout/Loader";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [hasOrdered, setHasOrdered] = useState(false);
  const [loading, setLoading] = useState(true);

  const [menu, setMenu] = useState(null);
  const [weeklyOrder, setWeeklyOrder] = useState({});
  const [savedOrder, setSavedOrder] = useState(null);

  const router = useRouter();

  const totalPrice = Object.values(weeklyOrder)
    .flat()
    .reduce((sum, meal) => sum + meal.price * meal.quantity, 0);

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("data-traffic-auth");
        if (!token) return router.push("/sign-in");

        const userRes = await axiosInstance.get("/auth/user", {
          headers: { "x-auth-token": token },
        });

        setUser(userRes.data);

        if (userRes.data.orders?.length > 0) {
          setHasOrdered(true);
          setSavedOrder(userRes.data.orders[0]);
        }

        if (!userRes.data.grade) router.push("/grade");
      } catch {
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await axiosInstance.get("/menu");
        setMenu(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMenu();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("data-traffic-auth");
    window.location.href = "/sign-in";
  };

  const getOrderedDay = (dayName) => {
    if (!savedOrder) return null;
    return savedOrder.days.find((d) => d.day === dayName);
  };

  const addMealToOrder = (day, meal) => {
    if (hasOrdered) return;

    setWeeklyOrder((prev) => {
      const dayMeals = prev[day] || [];
      const existing = dayMeals.find((m) => m.mealId === meal._id);

      if (existing) {
        return {
          ...prev,
          [day]: dayMeals.map((m) =>
            m.mealId === meal._id ? { ...m, quantity: m.quantity + 1 } : m,
          ),
        };
      }

      return {
        ...prev,
        [day]: [
          ...dayMeals,
          {
            mealId: meal._id,
            name: meal.name,
            price: meal.price,
            quantity: 1,
          },
        ],
      };
    });
  };

  const increaseQuantity = (day, mealId) => {
    setWeeklyOrder((prev) => ({
      ...prev,
      [day]: prev[day].map((m) =>
        m.mealId === mealId ? { ...m, quantity: m.quantity + 1 } : m,
      ),
    }));
  };

  const decreaseQuantity = (day, mealId) => {
    setWeeklyOrder((prev) => {
      const updated = prev[day]
        .map((m) =>
          m.mealId === mealId ? { ...m, quantity: m.quantity - 1 } : m,
        )
        .filter((m) => m.quantity > 0);

      if (updated.length === 0) {
        const copy = { ...prev };
        delete copy[day];
        return copy;
      }

      return { ...prev, [day]: updated };
    });
  };

  const submitWeeklyOrder = async () => {
    if (hasOrdered) return;

    try {
      await axiosInstance.post(
        "/order",
        { weeklyOrder, totalPrice },
        {
          headers: {
            "x-auth-token": localStorage.getItem("data-traffic-auth"),
          },
        },
      );

      alert("Order submitted ✅");
      setHasOrdered(true);
      setSavedOrder({
        days: Object.keys(weeklyOrder).map((day) => ({
          day,
          meals: weeklyOrder[day].map((m) => ({
            mealName: m.name,
            quantity: m.quantity,
            price: m.price,
          })),
        })),
        totalPrice,
        paid: false,
      });
      setWeeklyOrder({});
    } catch {
      alert("Failed to submit order");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center border-b mb-10">
        <Link href="/dashboard">
          <Image src="/logo-nobg.png" alt="Logo" width={48} height={48} />
        </Link>

        <div className="flex gap-4">
          {user?.role === "admin" && <Link href="/admin">Admin</Link>}
          <Button onClick={handleLogout}>Sign out</Button>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-center mb-4">Weekly Menu</h1>

      {menu && (
        <p className="text-center text-gray-600 mb-8">
          {new Date(menu.weekStart).toLocaleDateString()} –{" "}
          {new Date(menu.weekEnd).toLocaleDateString()}
        </p>
      )}

      {menu?.days.map((day) => {
        const orderedDay = getOrderedDay(day.day);

        return (
          <div key={day.day} className="border rounded mb-6">
            <h2 className="bg-gray-100 p-3 font-semibold text-lg">{day.day}</h2>

            {hasOrdered ? (
              <div className="p-4 bg-gray-50">
                {orderedDay ? (
                  orderedDay.meals.map((meal, index) => (
                    <div key={index} className="flex justify-between mb-2">
                      <span>
                        {meal.mealName} × {meal.quantity}
                      </span>
                      <span>${meal.price * meal.quantity}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No order for this day</p>
                )}
              </div>
            ) : (
              <>
                <table className="w-full">
                  <tbody>
                    {day.meals.length === 0 ? (
                      <tr>
                        <td className="p-4 text-center text-gray-500">
                          No meals
                        </td>
                      </tr>
                    ) : (
                      day.meals.map((meal) => (
                        <tr key={meal._id} className="border-t">
                          <td className="p-2">{meal.name}</td>
                          <td className="p-2">${meal.price}</td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => addMealToOrder(day.day, meal)}
                            >
                              ➕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {weeklyOrder[day.day] && (
                  <div className="p-3 bg-gray-50">
                    {weeklyOrder[day.day].map((meal) => (
                      <div key={meal.mealId} className="flex gap-3 mb-2">
                        <span>{meal.name}</span>
                        <button
                          onClick={() => decreaseQuantity(day.day, meal.mealId)}
                        >
                          ➖
                        </button>
                        <span>{meal.quantity}</span>
                        <button
                          onClick={() => increaseQuantity(day.day, meal.mealId)}
                        >
                          ➕
                        </button>
                        <span className="ml-auto">
                          ${meal.price * meal.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {!hasOrdered && (
        <div className="flex justify-center gap-6 mt-8">
          <p className="text-xl font-bold">Total: ${totalPrice}</p>
          <Button onClick={submitWeeklyOrder}>Submit Weekly Order</Button>
        </div>
      )}

      {hasOrdered && savedOrder && (
        <div className="text-center mt-8 text-xl font-bold">
          Weekly Total: ${savedOrder.totalPrice}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
