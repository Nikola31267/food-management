"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Check, X, Loader2, Trash } from "lucide-react";
import Loader from "@/components/layout/Loader";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { ShinyButton } from "@/components/ui/shiny-button";

const DAYS = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"];

const formatDate = (dateStr) => {
  if (!dateStr) return "—";

  return new Date(dateStr).toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const weekKey = (weekStart, weekEnd) => `${weekStart}__${weekEnd}`;

const buildDayMeals = (orders = []) => {
  const map = {};

  DAYS.forEach(
    (d) =>
      (map[d] = {
        meals: [],
        orderGot: false,
        weeklyOrderIndex: 0,
        dayIndex: -1,
      }),
  );

  orders.forEach((weeklyOrder, weeklyOrderIndex) => {
    const days = weeklyOrder?.days ?? [];

    days.forEach((dayEntry, dayIndex) => {
      const dayName = dayEntry?.day;

      if (dayName && map[dayName] !== undefined) {
        dayEntry?.meals?.forEach((m) => {
          if (m?.mealName) {
            map[dayName].meals.push({
              name: m.mealName,
              quantity: m.quantity,
              price: m.price,
            });
          }
        });

        map[dayName].orderGot = Boolean(dayEntry?.orderGot);
        map[dayName].weeklyOrderIndex = weeklyOrderIndex;
        map[dayName].dayIndex = dayIndex;
      }
    });
  });

  return map;
};

export default function ArchivedOrdersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingKey, setTogglingKey] = useState(null);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDay, setSelectedDay] = useState("");

  const ordersPerPage = 5;

  const classes = useMemo(() => [...new Set(rows.map((r) => r.grade))], [rows]);

  const weeks = useMemo(
    () => [
      ...new Map(
        rows
          .map((r) => ({
            key: weekKey(r.weekStart, r.weekEnd),
            label: `${formatDate(r.weekStart)} → ${formatDate(r.weekEnd)}`,
          }))
          .sort(
            (a, b) =>
              new Date(b.key.split("__")[0]) - new Date(a.key.split("__")[0]),
          )
          .map((w) => [w.key, w]),
      ).values(),
    ],
    [rows],
  );

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("/api/auth/user");

        setUser(response.data);

        if (response.data.role !== "admin") {
          window.location.href = "/dashboard";
        }
      } catch (error) {
        setError("Error fetching user profile");
        console.error(error);
        window.location.href = "/sign-in";
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const fetchArchivedOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await axios.get("/api/archived-orders");

      const flat = [];

      data.data.forEach((student) => {
        student.archivedOrders.forEach((order) => {
          flat.push({
            orderId: order._id,
            studentId: student._id,
            fullName: student.fullName ?? "—",
            grade: student.grade ?? "—",
            weekStart: order.weekStart,
            weekEnd: order.weekEnd,
            dayMeals: buildDayMeals(order.orders ?? []),
            total: order.total ?? 0,
          });
        });
      });

      setRows(flat);
    } catch (err) {
      const msg =
        err.response?.status === 401
          ? "Нямате право на достъп. Моля влезте отново."
          : err.response?.status === 403
            ? "Нямате администраторски права."
            : (err.response?.data?.message ?? "Грешка при зареждане.");

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass, selectedWeek, selectedDay]);

  useEffect(() => {
    if (rows.length === 0) return;

    const today = new Date();
    const todayTime = today.getTime();

    const matchingWeek = weeks.find((w) => {
      const [startStr, endStr] = w.key.split("__");
      const start = new Date(startStr).getTime();
      const end = new Date(endStr).getTime() + 86400000;

      return todayTime >= start && todayTime <= end;
    });

    if (matchingWeek && !selectedWeek) {
      setSelectedWeek(matchingWeek.key);
    }

    const dayIndex = today.getDay();

    if (dayIndex >= 1 && dayIndex <= 5 && !selectedDay) {
      setSelectedDay(DAYS[dayIndex - 1]);
    }
  }, [rows, weeks, selectedWeek, selectedDay]);

  const handleToggleOrderGot = async (row, day) => {
    const dayData = row.dayMeals[day];

    if (!dayData || dayData.meals.length === 0) return;

    const key = `${row.orderId}-${day}`;

    setTogglingKey(key);

    try {
      await axios.put(
        `/api/archived-orders/order-got/${row.studentId}/${row.orderId}`,
        {
          weeklyOrderIndex: dayData.weeklyOrderIndex,
          day,
          orderGot: !dayData.orderGot,
        },
      );

      setRows((prev) =>
        prev.map((r) => {
          if (r.orderId !== row.orderId) return r;

          return {
            ...r,
            dayMeals: {
              ...r.dayMeals,
              [day]: {
                ...r.dayMeals[day],
                orderGot: !dayData.orderGot,
              },
            },
          };
        }),
      );
    } catch (err) {
      alert(err.response?.data?.message ?? "Грешка при обновяване!");
    } finally {
      setTogglingKey(null);
    }
  };

  const handleDelete = async (orderId) => {
    if (
      !confirm("Сигурни ли сте, че искате да изтриете тази архивирана поръчка?")
    ) {
      return;
    }

    setDeletingId(orderId);

    try {
      await axios.delete(`/api/archived-orders/${orderId}`);
      await fetchArchivedOrders();
    } catch (err) {
      const msg =
        err.response?.status === 401
          ? "Нямате право на достъп. Моля влезте отново."
          : err.response?.status === 403
            ? "Нямате администраторски права."
            : (err.response?.data?.message ?? "Грешка при изтриване.");

      alert(`Грешка: ${msg}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRows = rows.filter((r) => {
    const matchesName = (r.fullName || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass ? r.grade === selectedClass : true;

    const matchesWeek = selectedWeek
      ? weekKey(r.weekStart, r.weekEnd) === selectedWeek
      : true;

    const matchesDay = selectedDay
      ? r.dayMeals[selectedDay]?.meals.length > 0
      : true;

    return matchesName && matchesClass && matchesWeek && matchesDay;
  });

  const downloadOrders = async () => {
    const filteredOrderIds = filteredRows.map((r) => r.orderId).join(",");

    const url = `/api/archived-orders/download?orderIds=${encodeURIComponent(
      filteredOrderIds,
    )}`;

    const res = await fetch(url, { credentials: "include" });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message || "Failed to download file");
    }

    const blob = await res.blob();

    let filename = "archived-orders.xlsx";
    const cd = res.headers.get("content-disposition") || "";
    const match = cd.match(/filename="([^"]+)"/i);

    if (match?.[1]) filename = match[1];

    const a = document.createElement("a");
    const objectUrl = window.URL.createObjectURL(blob);

    a.href = objectUrl;
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(objectUrl);
  };

  const totalPages = Math.ceil(filteredRows.length / ordersPerPage);

  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage,
  );

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-600">Грешка</p>

          <p className="mt-1 text-sm text-red-500">{error}</p>

          <button
            onClick={fetchArchivedOrders}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
          >
            Опитай отново
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SidebarNav user={user} />

      <main className="min-h-screen transition-all duration-300 md:pl-[var(--sidebar-width,16rem)]">
        <div className="min-h-screen bg-gray-50 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="mb-6 text-2xl font-bold sm:text-3xl">
              Поръчки за даване
            </h1>

            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
              <input
                type="text"
                placeholder="Търси по име..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full border p-3 outline-none focus:border-[#478BAF] focus:ring-2 focus:ring-[#478BAF]"
              />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:min-w-[520px]">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full rounded-full border p-3 outline-none focus:border-[#478BAF] focus:ring-2 focus:ring-[#478BAF]"
                >
                  <option value="">Всички класове</option>

                  {classes.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full rounded-full border p-3 outline-none focus:border-[#478BAF] focus:ring-2 focus:ring-[#478BAF]"
                >
                  <option value="">Всички седмици</option>

                  {weeks.map((w) => (
                    <option key={w.key} value={w.key}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDay("")}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
                  selectedDay === ""
                    ? "border-[#478BAF] bg-[#478BAF] text-white"
                    : "border-gray-300 hover:border-[#478BAF] hover:text-[#478BAF]"
                }`}
              >
                Всички дни
              </button>

              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day === selectedDay ? "" : day)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
                    selectedDay === day
                      ? "border-[#478BAF] bg-[#478BAF] text-white"
                      : "border-gray-300 hover:border-[#478BAF] hover:text-[#478BAF]"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {filteredRows.length > 0 && (
              <div className="relative z-0 mb-4">
                <ShinyButton
                  onClick={downloadOrders}
                  href="/"
                  className="w-full p-2 sm:w-auto"
                >
                  Изтегли поръчките за седмицата
                </ShinyButton>
              </div>
            )}

            {filteredRows.length === 0 ? (
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p>Няма намерени архивирани поръчки.</p>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-[980px] w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="border p-2 text-left">Име</th>
                          <th className="border p-2 text-left">Клас</th>
                          <th className="border p-2 text-left">Седмица</th>
                          <th className="border p-2 text-left">Поръчка</th>
                          <th className="border p-2 text-left">Сума (€)</th>
                          <th className="border p-2 text-center">Действия</th>
                        </tr>
                      </thead>

                      <tbody>
                        {paginatedRows.map((row) => (
                          <tr key={row.orderId} className="border-b align-top">
                            <td className="border p-2 font-medium">
                              {row.fullName}
                            </td>

                            <td className="border p-2">{row.grade}</td>

                            <td className="whitespace-nowrap border p-2 text-sm">
                              {formatDate(row.weekStart)} →{" "}
                              {formatDate(row.weekEnd)}
                            </td>

                            <td className="border p-2">
                              <div className="space-y-3">
                                {(selectedDay ? [selectedDay] : DAYS).map(
                                  (day) => {
                                    const dayData = row.dayMeals[day];
                                    const meals = dayData.meals;
                                    const got = dayData.orderGot;
                                    const toggleKey = `${row.orderId}-${day}`;
                                    const isToggling =
                                      togglingKey === toggleKey;
                                    const hasOrder = meals.length > 0;

                                    if (!hasOrder) return null;

                                    return (
                                      <div key={day}>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <strong>{day}:</strong>

                                          <span className="text-xs text-gray-700">
                                            Получено:
                                          </span>

                                          <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                              got
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                            }`}
                                          >
                                            {got ? (
                                              <>
                                                <Check className="h-4 w-4" /> Да
                                              </>
                                            ) : (
                                              <>
                                                <X className="h-4 w-4" /> Не
                                              </>
                                            )}
                                          </span>

                                          <button
                                            type="button"
                                            disabled={isToggling}
                                            onClick={() =>
                                              handleToggleOrderGot(row, day)
                                            }
                                            className={`rounded border px-2 py-1 text-xs transition-colors disabled:opacity-50 ${
                                              got
                                                ? "border-red-300 hover:bg-red-50"
                                                : "border-green-300 hover:bg-green-50"
                                            }`}
                                          >
                                            {isToggling ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : got ? (
                                              "Отмени"
                                            ) : (
                                              "Отбележи"
                                            )}
                                          </button>
                                        </div>

                                        <ul className="ml-4 mt-1 list-disc space-y-1">
                                          {meals.map((meal, i) => (
                                            <li key={i}>
                                              {meal.name} x {meal.quantity} = €
                                              {(
                                                (meal.price ?? 0) *
                                                (meal.quantity ?? 1)
                                              ).toFixed(2)}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </td>

                            <td className="whitespace-nowrap border p-2 font-bold">
                              €
                              {new Intl.NumberFormat("de-DE", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }).format(row.total)}
                            </td>

                            <td className="border p-2 text-center">
                              <button
                                onClick={() => handleDelete(row.orderId)}
                                disabled={deletingId === row.orderId}
                                className="inline-flex items-center justify-center rounded bg-red-600 px-3 py-2 text-white transition-colors duration-300 hover:bg-red-700 disabled:opacity-50"
                              >
                                {deletingId === row.orderId ? (
                                  <Loader2 className="animate-spin" />
                                ) : (
                                  <Trash size={18} />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-full rounded-lg border border-[#478BAF] px-4 py-2 transition-colors duration-300 hover:bg-[#478BAF] hover:text-white disabled:opacity-50 sm:w-auto"
                  >
                    Previous
                  </button>

                  <span className="font-semibold">
                    Page {currentPage} of {totalPages || 1}
                  </span>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="w-full rounded-lg border border-[#478BAF] px-4 py-2 transition-colors duration-300 hover:bg-[#478BAF] hover:text-white disabled:opacity-50 sm:w-auto"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}