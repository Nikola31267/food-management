"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import Loader from "@/components/layout/Loader";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const DAYS = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"];

const AdminPage = () => {
  const [loading, setLoading] = useState(true);
  const [weeklyMenu, setWeeklyMenu] = useState(null);

  const [form, setForm] = useState({
    weekStart: "",
    weekEnd: "",
    orderDeadline: "", // ⬅️ NEW
    days: DAYS.map((d) => ({
      day: d,
      meals: [],
    })),
  });

  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("data-traffic-auth");
        if (!token) return router.push("/sign-in");

        const user = await axiosInstance.get("/auth/user", {
          headers: { "x-auth-token": token },
        });

        if (user.data.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        await fetchMenu();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const fetchMenu = async () => {
    const res = await axiosInstance.get("/menu");

    if (res.data?.days) {
      setWeeklyMenu(res.data);
    } else {
      setWeeklyMenu(null);
    }
  };

  const addMeal = (dayIndex) => {
    const copy = [...form.days];
    copy[dayIndex].meals.push({ name: "", price: "" });
    setForm({ ...form, days: copy });
  };

  const handleMealChange = (dayIndex, mealIndex, field, value) => {
    const copy = [...form.days];
    copy[dayIndex].meals[mealIndex][field] = value;
    setForm({ ...form, days: copy });
  };

  const handleSubmit = async () => {
    try {
      await axiosInstance.post("/menu", form, {
        headers: {
          "x-auth-token": localStorage.getItem("data-traffic-auth"),
        },
      });

      alert("Weekly menu saved ✅");
      await fetchMenu();
    } catch {
      alert("Failed to save menu");
    }
  };

  const deleteMenu = async () => {
    if (!confirm("Delete entire weekly menu?")) return;

    await axiosInstance.delete(`/menu/${weeklyMenu._id}`, {
      headers: {
        "x-auth-token": localStorage.getItem("data-traffic-auth"),
      },
    });

    setWeeklyMenu(null);
  };

  const deleteMeal = async (day, mealId) => {
    await axiosInstance.delete(`/menu/${weeklyMenu._id}/${day}/${mealId}`, {
      headers: {
        "x-auth-token": localStorage.getItem("data-traffic-auth"),
      },
    });

    fetchMenu();
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-12">
      <h1 className="text-3xl font-bold">Admin Weekly Menu</h1>

      <Link href="/admin/orders" className="text-blue-600 underline">
        View Orders
      </Link>

      <div className="border rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold">Create Weekly Menu</h2>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="date"
            className="border p-2"
            value={form.weekStart}
            onChange={(e) => setForm({ ...form, weekStart: e.target.value })}
          />

          <input
            type="date"
            className="border p-2"
            value={form.weekEnd}
            onChange={(e) => setForm({ ...form, weekEnd: e.target.value })}
          />
        </div>

        {form.days.map((day, dayIndex) => (
          <div key={day.day} className="border rounded-lg p-4 space-y-3">
            <h3 className="font-bold text-lg">{day.day}</h3>

            {day.meals.map((meal, mealIndex) => (
              <div key={mealIndex} className="border p-3 rounded space-y-2">
                <input
                  className="border p-2 w-full"
                  placeholder="Meal name"
                  value={meal.name}
                  onChange={(e) =>
                    handleMealChange(
                      dayIndex,
                      mealIndex,
                      "name",
                      e.target.value,
                    )
                  }
                />

                <input
                  className="border p-2 w-full"
                  type="number"
                  placeholder="Price"
                  value={meal.price}
                  onChange={(e) =>
                    handleMealChange(
                      dayIndex,
                      mealIndex,
                      "price",
                      e.target.value,
                    )
                  }
                />
              </div>
            ))}

            <Button variant="outline" onClick={() => addMeal(dayIndex)}>
              + Add Meal
            </Button>
          </div>
        ))}

        <Button onClick={handleSubmit}>Save Weekly Menu</Button>
      </div>

      {weeklyMenu?.days?.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Current Weekly Menu</h2>

            <Button variant="destructive" onClick={deleteMenu}>
              Delete Weekly Menu
            </Button>
          </div>

          <p className="text-gray-600">
            {new Date(weeklyMenu.weekStart).toLocaleDateString()} –{" "}
            {new Date(weeklyMenu.weekEnd).toLocaleDateString()}
          </p>

          {weeklyMenu.days.map((day) => (
            <div key={day.day} className="border rounded p-4">
              <h3 className="font-bold">{day.day}</h3>

              {day.meals.length === 0 ? (
                <p className="text-gray-500">No meals</p>
              ) : (
                <ul className="space-y-1">
                  {day.meals.map((meal) => (
                    <li
                      key={meal._id}
                      className="flex justify-between items-center"
                    >
                      <span>
                        {meal.name} — ${meal.price}
                      </span>

                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => deleteMeal(day.day, meal._id)}
                      >
                        ❌
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
