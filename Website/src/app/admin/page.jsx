"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import Loader from "@/components/layout/Loader";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const AdminPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [menu, setMenu] = useState({
    day: "Monday",
    meals: [],
  });

  const router = useRouter();

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

        if (response.data.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        setUser(response.data);
        setLoading(false);
      } catch {
        router.push("/sign-in");
      }
    };

    checkAuthAndAccess();
  }, [router]);

  // ---------- meal logic ----------

  const addMeal = () => {
    setMenu((prev) => ({
      ...prev,
      meals: [...prev.meals, { name: "", price: "" }],
    }));
  };

  const handleMealChange = (index, field, value) => {
    const updatedMeals = [...menu.meals];
    updatedMeals[index][field] = value;

    setMenu({ ...menu, meals: updatedMeals });
  };

  const handleSubmit = async () => {
    try {
      await axiosInstance.post("/menu", menu, {
        headers: {
          "x-auth-token": localStorage.getItem("data-traffic-auth"),
        },
      });

      alert("Menu saved successfully ✅");

      setMenu({
        day: "Monday",
        meals: [],
      });
    } catch (err) {
      alert("Failed to save menu");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Daily Menu</h1>
      <Link href="/admin/orders">Orders</Link>

      {/* DAY */}
      <select
        className="border p-2 w-full"
        value={menu.day}
        onChange={(e) => setMenu({ ...menu, day: e.target.value })}
      >
        <option>Monday</option>
        <option>Tuesday</option>
        <option>Wednesday</option>
        <option>Thursday</option>
        <option>Friday</option>
        <option>Saturday</option>
        <option>Sunday</option>
      </select>

      {/* MEALS */}
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

      <Button onClick={addMeal} variant="outline">
        + Add Meal
      </Button>

      <Button onClick={handleSubmit}>Save Menu</Button>
    </div>
  );
};

export default AdminPage;
