"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import Loader from "@/components/layout/Loader";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/admin/Navbar";
import { ShinyButton } from "@/components/ui/shiny-button";

const DAYS = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"];

const AdminPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState("");
  const [weeklyMenu, setWeeklyMenu] = useState(null);
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
          setUser(response.data);
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

  const [form, setForm] = useState({
    weekStart: "",
    weekEnd: "",
    orderDeadline: "",
    days: DAYS.map((d) => ({ day: d, meals: [] })),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const formatDateForInput = (isoDate) => {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateTimeForInput = (isoDate) => {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const toISO = (localDate) => new Date(localDate).toISOString();

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
    setWeeklyMenu(res.data?.days ? res.data : null);
  };

  const addMeal = (dayIndex) => {
    const copy = [...form.days];
    copy[dayIndex].meals.push({ name: "", price: "" });
    setForm({ ...form, days: copy });
  };

  const removeMeal = (dayIndex, mealIndex) => {
    const copy = [...form.days];
    copy[dayIndex].meals.splice(mealIndex, 1);
    setForm({ ...form, days: copy });
  };

  const handleMealChange = (dayIndex, mealIndex, field, value) => {
    const copy = [...form.days];
    copy[dayIndex].meals[mealIndex][field] = value;
    setForm({ ...form, days: copy });
  };

  const handleSubmit = async () => {
    if (!form.orderDeadline) {
      alert("Please set an order deadline");
      return;
    }

    try {
      await axiosInstance.post("/menu", form, {
        headers: {
          "x-auth-token": localStorage.getItem("data-traffic-auth"),
        },
      });

      alert("Weekly menu created ✅");
      await fetchMenu();

      setForm({
        weekStart: "",
        weekEnd: "",
        orderDeadline: "",
        days: DAYS.map((d) => ({ day: d, meals: [] })),
      });
    } catch {
      alert("Failed to save menu");
    }
  };

  const startEditing = () => {
    const copy = JSON.parse(JSON.stringify(weeklyMenu));

    copy.weekStart = formatDateForInput(copy.weekStart);
    copy.weekEnd = formatDateForInput(copy.weekEnd);
    copy.orderDeadline = formatDateTimeForInput(copy.orderDeadline);

    setEditForm(copy);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditForm(null);
    setIsEditing(false);
  };

  const saveEdits = async () => {
    try {
      const payload = {
        ...editForm,
        weekStart: toISO(editForm.weekStart),
        weekEnd: toISO(editForm.weekEnd),
        orderDeadline: toISO(editForm.orderDeadline),
      };

      await axiosInstance.put(`/menu/${weeklyMenu._id}`, payload, {
        headers: {
          "x-auth-token": localStorage.getItem("data-traffic-auth"),
        },
      });

      alert("Menu updated ✅");
      setIsEditing(false);
      fetchMenu();
    } catch {
      alert("Failed to update menu");
    }
  };

  const addEditMeal = (dayIndex) => {
    const copy = [...editForm.days];
    copy[dayIndex].meals.push({ name: "", price: "" });
    setEditForm({ ...editForm, days: copy });
  };

  const removeEditMeal = (dayIndex, mealIndex) => {
    const copy = [...editForm.days];
    copy[dayIndex].meals.splice(mealIndex, 1);
    setEditForm({ ...editForm, days: copy });
  };

  const handleEditMealChange = (dayIndex, mealIndex, field, value) => {
    const copy = [...editForm.days];
    copy[dayIndex].meals[mealIndex][field] = value;
    setEditForm({ ...editForm, days: copy });
  };

  const formatDate = (date) => new Date(date).toISOString().split("T")[0];

  const deleteMenu = async () => {
    const firstConfirm = window.confirm("Delete entire weekly menu?");
    if (!firstConfirm) return;

    const downloadOrders = window.confirm(
      "Do you want to download all orders before deleting?",
    );

    const response = await axiosInstance.delete(
      `/menu/${weeklyMenu._id}?download=${downloadOrders}`,
      {
        headers: {
          "x-auth-token": localStorage.getItem("data-traffic-auth"),
        },
        responseType: downloadOrders ? "blob" : "json",
      },
    );

    if (downloadOrders) {
      const startDate = formatDate(weeklyMenu.weekStart);
      const endDate = formatDate(weeklyMenu.weekEnd);

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${startDate}_to_${endDate}.csv`;
      a.click();

      window.URL.revokeObjectURL(url);
    }

    setWeeklyMenu(null);
    setIsEditing(false);
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-12">
      <Navbar user={user} />

      <h2 className="text-xl font-semibold">Създай седмично меню</h2>
      <div className="border rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold">От:</h3>
            <input
              type="date"
              className="border p-2"
              value={form.weekStart}
              onChange={(e) => setForm({ ...form, weekStart: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-bold">До:</h3>
            <input
              type="date"
              className="border p-2"
              value={form.weekEnd}
              onChange={(e) => setForm({ ...form, weekEnd: e.target.value })}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-bold">Последен ден за поръчка:</h3>

          <input
            type="datetime-local"
            className="border p-2 w-full"
            value={form.orderDeadline}
            onChange={(e) =>
              setForm({ ...form, orderDeadline: e.target.value })
            }
          />
        </div>

        {form.days.map((day, dayIndex) => (
          <div key={day.day} className="border p-4 rounded">
            <h3 className="font-bold">{day.day}</h3>
            {day.meals.map((meal, mealIndex) => (
              <div key={mealIndex} className="flex gap-2 mt-2 items-center">
                <input
                  className="border p-2 flex-1"
                  placeholder="Име на ястието"
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
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    className="border p-2 w-24"
                    placeholder="Цена"
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
                  <p>€</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => removeMeal(dayIndex, mealIndex)}
                  className="ml-4"
                >
                  −
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              className="mt-2"
              onClick={() => addMeal(dayIndex)}
            >
              + Добави ястие
            </Button>
          </div>
        ))}

        <ShinyButton href="#" className="p-2" onClick={handleSubmit}>
          Създай
        </ShinyButton>
      </div>

      {weeklyMenu && (
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Сегашно меню</h2>
            <div className="flex gap-2">
              {!isEditing && (
                <Button variant="outline" onClick={startEditing}>
                  ✏️ Редактирай
                </Button>
              )}
              <Button variant="destructive" onClick={deleteMenu}>
                Изтрий
              </Button>
            </div>
          </div>

          {isEditing ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  className="border p-2"
                  value={editForm.weekStart}
                  onChange={(e) =>
                    setEditForm({ ...editForm, weekStart: e.target.value })
                  }
                />
                <input
                  type="date"
                  className="border p-2"
                  value={editForm.weekEnd}
                  onChange={(e) =>
                    setEditForm({ ...editForm, weekEnd: e.target.value })
                  }
                />
              </div>

              <input
                type="datetime-local"
                className="border p-2 w-full"
                value={editForm.orderDeadline}
                onChange={(e) =>
                  setEditForm({ ...editForm, orderDeadline: e.target.value })
                }
              />

              {editForm.days.map((day, dayIndex) => (
                <div key={day.day} className="border p-4 rounded">
                  <h3 className="font-bold">{day.day}</h3>
                  {day.meals.map((meal, mealIndex) => (
                    <div
                      key={mealIndex}
                      className="flex gap-2 mt-2 items-center"
                    >
                      <input
                        className="border p-2 flex-1"
                        value={meal.name}
                        onChange={(e) =>
                          handleEditMealChange(
                            dayIndex,
                            mealIndex,
                            "name",
                            e.target.value,
                          )
                        }
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          className="border p-2 w-24"
                          value={meal.price}
                          onChange={(e) =>
                            handleEditMealChange(
                              dayIndex,
                              mealIndex,
                              "price",
                              e.target.value,
                            )
                          }
                        />
                        <p>€</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => removeEditMeal(dayIndex, mealIndex)}
                        className="ml-4"
                      >
                        −
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => addEditMeal(dayIndex)}
                  >
                    + Добави ястие
                  </Button>
                </div>
              ))}

              <div className="flex gap-4">
                <Button onClick={saveEdits}>Запази промените</Button>
                <Button variant="outline" onClick={cancelEditing}>
                  Откажи
                </Button>
              </div>
            </>
          ) : (
            <p className="text-gray-600">
              {new Date(weeklyMenu.weekStart).toLocaleDateString()} –{" "}
              {new Date(weeklyMenu.weekEnd).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
