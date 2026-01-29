"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import Loader from "@/components/layout/Loader";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const AdminPage = () => {
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState([]);

  const [menu, setMenu] = useState({
    day: "Понеделник",
    meals: [],
  });

  const router = useRouter();

  // ---------- AUTH ----------
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

        await fetchMenus();
        setLoading(false);
      } catch {
        router.push("/sign-in");
      }
    };

    init();
  }, [router]);

  const fetchMenus = async () => {
    const res = await axiosInstance.get("/menu");
    setMenus(res.data);
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
    } catch {
      alert("Failed to delete meal");
    }
  };

  const addMeal = () => {
    setMenu((prev) => ({
      ...prev,
      meals: [...prev.meals, { name: "", price: "" }],
    }));
  };

  const handleMealChange = (index, field, value) => {
    const copy = [...menu.meals];
    copy[index][field] = value;
    setMenu({ ...menu, meals: copy });
  };

  const handleSubmit = async () => {
    try {
      await axiosInstance.post("/menu", menu, {
        headers: {
          "x-auth-token": localStorage.getItem("data-traffic-auth"),
        },
      });

      alert("Menu saved ✅");
      setMenu({ day: "Monday", meals: [] });
      fetchMenus();
    } catch {
      alert("Failed to save menu");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-12">
      <h1 className="text-3xl font-bold">Admin Menu Management</h1>

      <Link href="/admin/orders" className="text-blue-600 underline">
        View Orders
      </Link>

      {/* ================= ADD MENU ================= */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Add New Menu</h2>

        <select
          className="border p-2 w-full"
          value={menu.day}
          onChange={(e) => setMenu({ ...menu, day: e.target.value })}
        >
          {["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        {menu.meals.map((meal, index) => (
          <div key={index} className="border p-3 rounded space-y-2">
            <input
              className="border p-2 w-full"
              placeholder="Meal name"
              value={meal.name}
              onChange={(e) => handleMealChange(index, "name", e.target.value)}
            />

            <input
              className="border p-2 w-full"
              type="number"
              placeholder="Price"
              value={meal.price}
              onChange={(e) => handleMealChange(index, "price", e.target.value)}
            />
          </div>
        ))}

        <Button variant="outline" onClick={addMeal}>
          + Add Meal
        </Button>

        <Button onClick={handleSubmit}>Save Menu</Button>
      </div>

      {/* ================= CURRENT MENUS ================= */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Current Menus</h2>

        {menus.map((day) => (
          <div key={day._id} className="border rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2">{day.day}</h3>

            {day.meals.length === 0 ? (
              <p className="text-gray-500">No meals</p>
            ) : (
              <ul className="space-y-2">
                {day.meals.map((meal) => (
                  <li
                    key={meal._id}
                    className="flex justify-between items-center"
                  >
                    <span>
                      {meal.name} — ${meal.price}
                    </span>

                    <button
                      onClick={() => deleteMeal(day.day, meal._id)}
                      className="text-red-600 hover:text-red-800"
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
    </div>
  );
};

export default AdminPage;
