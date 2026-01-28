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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState([]);
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
        setUser(response.data);

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

      // update UI immediately
      setMenus((prev) =>
        prev.map((d) =>
          d.day === day
            ? {
                ...d,
                meals: d.meals.filter((m) => m._id !== mealId),
              }
            : d,
        ),
      );
    } catch (err) {
      alert("Failed to delete meal");
    }
  };

  if (loading) {
    return <Loader />;
  }

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
          {user?.role == "admin" ? (
            <Link
              className="block w-full text-left text-sm text-gray-700 bg-transparent border-none cursor-pointer transition-colors hover:bg-gray-100"
              href="/admin"
            >
              Admin
            </Link>
          ) : (
            <></>
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

      <h1 className="text-3xl font-bold text-center">Weekly Menu</h1>

      {menus.map((dayMenu) => (
        <div key={dayMenu._id} className="border rounded-lg overflow-hidden">
          <h2 className="bg-gray-100 p-3 text-xl font-semibold">
            {dayMenu.day}
          </h2>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-2 text-left">Meal</th>
                <th className="p-2 text-left">Price</th>
              </tr>
            </thead>

            <tbody>
              {dayMenu.meals.length === 0 ? (
                <tr>
                  <td colSpan="2" className="p-3 text-center text-gray-500">
                    No meals added
                  </td>
                </tr>
              ) : (
                dayMenu.meals.map((meal, index) => (
                  <tr key={meal._id} className="border-b">
                    <td className="p-2">{meal.name}</td>
                    <td className="p-2">${meal.price}</td>

                    {user?.role == "admin" && (
                      <td className="p-2 text-center">
                        <button
                          onClick={() => deleteMeal(dayMenu.day, meal._id)}
                          className="text-red-600 hover:text-red-800 text-lg"
                          title="Delete meal"
                        >
                          🗑
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
