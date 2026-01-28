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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState([]);
  const [weeklyOrder, setWeeklyOrder] = useState({});
  const [savedOrder, setSavedOrder] = useState(null);
  const router = useRouter();

  const totalPrice = Object.values(weeklyOrder)
    .flat()
    .reduce((sum, meal) => sum + meal.price * meal.quantity, 0);

  useEffect(() => {
    const checkAuthAndAccess = async () => {
      if (!localStorage.getItem("data-traffic-auth")) {
        router.push("/sign-in");
        return;
      }

      try {
        const response = await axiosInstance.get("/auth/user", {
          headers: {
            "x-auth-token": localStorage.getItem("data-traffic-auth"),
          },
        });
        setUser(response.data);

        if (response.data.orders && response.data.orders.length > 0) {
          setHasOrdered(true);
          setSavedOrder(response.data.orders[0]);
        }

        if (!response.data.grade) {
          router.push("/grade");
        }

        setLoading(false);
      } catch (error) {
        setError("Failed to fetch user data");
        router.push("/sign-in");
      }
    };

    checkAuthAndAccess();
  }, [router]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await axiosInstance.get("/menu");
        setMenus(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("data-traffic-auth");
    window.location.href = "/sign-in";
  };

  const deleteMeal = async (day, mealId) => {
    try {
      await axiosInstance.delete(`/menu/${day}/${mealId}`, {
        headers: {
          "x-auth-token": localStorage.getItem("data-traffic-auth"),
        },
      });

      setMenus((prev) =>
        prev.map((d) =>
          d.day === day
            ? { ...d, meals: d.meals.filter((m) => m._id !== mealId) }
            : d,
        ),
      );
    } catch (err) {
      alert("Failed to delete meal");
    }
  };

  const addMealToOrder = (day, meal) => {
    if (hasOrdered) return;
    setWeeklyOrder((prev) => {
      const dayMeals = prev[day] || [];
      const existingMeal = dayMeals.find((m) => m.mealId === meal._id);

      if (existingMeal) {
        return {
          ...prev,
          [day]: dayMeals.map((m) =>
            m.mealId === meal._id ? { ...m, quantity: m.quantity + 1 } : m,
          ),
        };
      } else {
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
      }
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
      const updatedMeals = prev[day]
        .map((m) =>
          m.mealId === mealId ? { ...m, quantity: m.quantity - 1 } : m,
        )
        .filter((m) => m.quantity > 0);

      if (updatedMeals.length === 0) {
        const copy = { ...prev };
        delete copy[day];
        return copy;
      }

      return {
        ...prev,
        [day]: updatedMeals,
      };
    });
  };

  const removeMeal = (day, mealId) => {
    setWeeklyOrder((prev) => {
      const updatedMeals = prev[day].filter((m) => m.mealId !== mealId);

      if (updatedMeals.length === 0) {
        const copy = { ...prev };
        delete copy[day];
        return copy;
      }

      return {
        ...prev,
        [day]: updatedMeals,
      };
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
      alert(`Order submitted successfully! Total: $${totalPrice}`);
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
      });
      setWeeklyOrder({});
      setHasOrdered(true);
    } catch (err) {
      console.error(err);
      alert("Failed to submit order");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center border-b border-gray-200 mb-12">
        <div className="flex items-center">
          <Link href="/dashboard">
            <Image
              src="/logo-nobg.png"
              alt="Logo"
              className="h-12 w-12 mr-2"
              width={48}
              height={48}
            />
          </Link>
        </div>
        <div className="flex items-center">
          {user?.role === "admin" && (
            <Link
              className="block w-full text-left text-sm text-gray-700 bg-transparent border-none cursor-pointer transition-colors hover:bg-gray-100"
              href="/admin"
            >
              Admin
            </Link>
          )}
          <Button
            onClick={handleLogout}
            className="block w-full text-left text-sm text-gray-700 bg-transparent border-none cursor-pointer transition-colors hover:bg-gray-100"
          >
            Sign out
          </Button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <h1 className="text-3xl font-bold text-center mb-6">Weekly Menu</h1>

      {hasOrdered && savedOrder ? (
        <div className="bg-green-50 border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Your Weekly Order
          </h2>

          {savedOrder.days.map((day) => (
            <div key={day.day} className="mb-4">
              <h3 className="font-semibold text-lg">{day.day}</h3>

              <ul className="ml-4 list-disc">
                {day.meals.map((meal, index) => (
                  <li key={index}>
                    {meal.mealName} × {meal.quantity} = $
                    {meal.price * meal.quantity}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="mt-6 text-xl font-bold text-center">
            Final Total: ${savedOrder.totalPrice}
          </div>
        </div>
      ) : (
        menus.map((dayMenu) => (
          <div
            key={dayMenu._id}
            className="border rounded-lg overflow-hidden mb-6"
          >
            <h2 className="bg-gray-100 p-3 text-xl font-semibold">
              {dayMenu.day}
            </h2>

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-2 text-left">Meal</th>
                  <th className="p-2 text-left">Price</th>
                  <th className="p-2 text-center">Add</th>
                </tr>
              </thead>
              <tbody>
                {dayMenu.meals.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-3 text-center text-gray-500">
                      No meals added
                    </td>
                  </tr>
                ) : (
                  dayMenu.meals.map((meal) => (
                    <tr key={meal._id} className="border-b">
                      <td className="p-2">{meal.name}</td>
                      <td className="p-2">${meal.price}</td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => addMealToOrder(dayMenu.day, meal)}
                          className={`text-green-600 hover:text-green-800 text-lg ${
                            hasOrdered ? "cursor-not-allowed opacity-50" : ""
                          }`}
                          title={hasOrdered ? "Already ordered" : "Add meal"}
                          disabled={hasOrdered}
                        >
                          ➕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Selected meals for this day */}
            {weeklyOrder[dayMenu.day] &&
              weeklyOrder[dayMenu.day].length > 0 && (
                <div className="p-3 bg-gray-50">
                  <h3 className="font-semibold mb-2">Selected:</h3>
                  <ul>
                    {weeklyOrder[dayMenu.day].map((meal) => (
                      <li
                        key={meal.mealId}
                        className="flex items-center gap-3 mb-2"
                      >
                        <span className="w-32">{meal.name}</span>

                        <button
                          onClick={() =>
                            decreaseQuantity(dayMenu.day, meal.mealId)
                          }
                          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          ➖
                        </button>

                        <span className="font-semibold w-6 text-center">
                          {meal.quantity}
                        </span>

                        <button
                          onClick={() =>
                            increaseQuantity(dayMenu.day, meal.mealId)
                          }
                          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          ➕
                        </button>

                        <button
                          onClick={() => removeMeal(dayMenu.day, meal.mealId)}
                          className="ml-2 text-red-600 hover:text-red-800"
                          title="Remove"
                        >
                          ❌
                        </button>

                        <span className="ml-auto font-semibold">
                          ${meal.price * meal.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        ))
      )}
      {!hasOrdered && (
        <div className="flex justify-center items-center mt-6 space-x-4">
          <p className="text-xl font-bold">Final Total: ${totalPrice}</p>
          <Button
            onClick={submitWeeklyOrder}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Submit Weekly Order
          </Button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
