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
  const router = useRouter();

  // Calculate total price for all days
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

  const submitWeeklyOrder = async () => {
    if (hasOrdered) return;
    try {
      await axiosInstance.post(
        "/order",
        { weeklyOrder, totalPrice }, // include totalPrice
        {
          headers: {
            "x-auth-token": localStorage.getItem("data-traffic-auth"),
          },
        },
      );
      alert(`Order submitted successfully! Total: $${totalPrice}`);
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

      <h1>Имейл: {user?.email}</h1>
      <h1>Имена: {user?.fullName}</h1>
      <h1>Клас: {user?.grade}</h1>

      <h1 className="text-3xl font-bold text-center mb-6">Weekly Menu</h1>

      {hasOrdered ? (
        <div className="p-6 text-center bg-yellow-100 border rounded-lg">
          <p className="font-semibold text-lg">
            You have already submitted your weekly order and cannot order again.
          </p>
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
                      <li key={meal.mealId}>
                        {meal.name} x {meal.quantity} = $
                        {meal.price * meal.quantity}
                      </li>
                    ))}
                  </ul>
                  <p className="font-bold mt-2">
                    Total for {dayMenu.day}: $
                    {weeklyOrder[dayMenu.day].reduce(
                      (sum, m) => sum + m.price * m.quantity,
                      0,
                    )}
                  </p>
                </div>
              )}
          </div>
        ))
      )}

      {/* Submit weekly order with total sum */}
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
