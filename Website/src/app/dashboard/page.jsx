"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import Loader from "@/components/layout/Loader";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { toast } from "react-toastify";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [hasOrdered, setHasOrdered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submiting, setSubmiting] = useState(false);

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
        const latestMenuId = menu?._id;

        const userOrderForMenu = userRes.data.orders?.find(
          (o) => o.menuId === latestMenuId,
        );

        if (userOrderForMenu) {
          setHasOrdered(true);
          setSavedOrder(userOrderForMenu);
        }

        if (!userRes.data.grade) router.push("/grade");
      } catch {
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router, menu]);

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
    window.location.reload();
  };

  const getOrderedDay = (dayName) => {
    if (!savedOrder) return null;
    return savedOrder.days.find((d) => d.day === dayName);
  };

  const addMealToOrder = (day, meal) => {
    if (hasOrdered || menuExpired) return;

    const dayMeals = weeklyOrder[day] || [];
    const existing = dayMeals.find((m) => m.mealId === meal._id);

    // 👉 Toast OUTSIDE state update
    if (existing) {
      toast.info(`Добавено още 1 × ${meal.name}`, {
        toastId: `${meal._id}-increase`,
      });
    } else {
      toast.success(`${meal.name} е добавено към поръчката!`, {
        toastId: meal._id,
      });
    }

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
    if (menuExpired) return;

    setWeeklyOrder((prev) => ({
      ...prev,
      [day]: prev[day].map((m) =>
        m.mealId === mealId ? { ...m, quantity: m.quantity + 1 } : m,
      ),
    }));
  };

  const decreaseQuantity = (day, mealId) => {
    if (menuExpired) return;

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
    if (hasOrdered || menuExpired) return;
    setSubmiting(true);

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

      const newSavedOrder = {
        menuId: menu._id,
        days: Object.entries(weeklyOrder).map(([day, meals]) => ({
          day,
          meals: meals.map((m) => ({
            mealName: m.name,
            quantity: m.quantity,
            price: m.price,
          })),
        })),
        totalPrice,
        paid: false,
      };

      setSavedOrder(newSavedOrder);
      setHasOrdered(true);
      setWeeklyOrder({});

      toast.success("Поръчката е изпратена!");
      setSubmiting(false);
    } catch (err) {
      const message = err.response?.data?.error || "Failed to submit order";
      toast.error(message);
    }
  };

  const hasMenu = menu?.days?.some((day) => day.meals && day.meals.length > 0);
  const menuExpired =
    menu?.orderDeadline && new Date(menu.orderDeadline) < new Date();

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center border-b mb-10">
        <div className="flex gap-2 items-center">
          <Link href="/dashboard">
            <Image src="/logo-nobg.png" alt="Logo" width={48} height={48} />
          </Link>
          <h1 className="text-lg font-semibold">
            {user?.fullName} {user?.grade}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="hover:underline hover:text-[#387fa5] transition-colors duration-200"
            >
              Admin
            </Link>
          )}
          <ShinyButton
            className="bg-[#478BAF] hover:bg-[#387fa5] py-1 px-1.5"
            href="#"
            onClick={handleLogout}
          >
            Излез от профила
          </ShinyButton>
        </div>
      </div>

      {!menu && (
        <h1 className="text-xl font-bold text-center mb-4 text-gray-600">
          Няма активно меню за седмицата
        </h1>
      )}

      {menu && (
        <>
          <h1 className="text-3xl font-bold text-center mb-4">
            Меню за седмица:
          </h1>
          <div className="flex flex-col text-center gap-2 text-gray-600">
            <p>
              {new Date(menu.weekStart).toLocaleDateString()} –{" "}
              {new Date(menu.weekEnd).toLocaleDateString()}
            </p>
            <p>
              Последна поръчка:{" "}
              {new Date(menu.orderDeadline).toLocaleString("bg-BG", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </>
      )}

      {menuExpired && (
        <p className="text-center text-red-600 font-semibold mb-8">
          Поръчките за тази седмица са затворени
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
                      <span>€{meal.price * meal.quantity}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    Няма поръчка за този ден
                  </p>
                )}
              </div>
            ) : menuExpired ? (
              <div className="p-4 text-center text-gray-500">
                Поръчването приключи
              </div>
            ) : (
              <>
                <table className="w-full">
                  <tbody>
                    {day.meals.length === 0 ? (
                      <tr>
                        <td className="p-4 text-center text-gray-500">
                          Няма зададена храна
                        </td>
                      </tr>
                    ) : (
                      day.meals.map((meal) => (
                        <tr key={meal._id} className="border-t">
                          <td className="p-2">{meal.name}</td>
                          <td className="p-2">{meal.weight}</td>
                          <td className="p-2">€{meal.price}</td>
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
                          €{meal.price * meal.quantity}
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

      {!hasOrdered && hasMenu && !menuExpired && (
        <div className="flex justify-center gap-6 mt-8">
          <p className="text-xl font-bold">
            Общо:{" "}
            <span>
              {new Intl.NumberFormat("de-DE", {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(totalPrice)}
            </span>
          </p>
          <ShinyButton
            href="#"
            disabled={submiting}
            onClick={submitWeeklyOrder}
          >
            Поръчай
          </ShinyButton>
        </div>
      )}

      {hasOrdered && savedOrder && (
        <div className="text-center mt-8 text-xl font-bold">
          Дължима сума:{" "}
          {savedOrder?.paid ? (
            <span>0 €</span>
          ) : (
            <span>
              {new Intl.NumberFormat("de-DE", {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(savedOrder.totalPrice)}
            </span>
          )}
          <p>Платено: {savedOrder?.paid ? <>Да</> : <>Не</>}</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
