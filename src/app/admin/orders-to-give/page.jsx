"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Check, X, Loader2, Trash } from "lucide-react";
import Loader from "@/components/layout/Loader";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

const getToken = () => {
  try {
    return localStorage.getItem("data-auth-eduiteh-food") ?? "";
  } catch {
    return "";
  }
};

const authHeaders = () => ({
  "x-auth-token": getToken(),
});

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
          if (m?.mealName)
            map[dayName].meals.push({
              name: m.mealName,
              quantity: m.quantity,
              price: m.price,
            });
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
  const ordersPerPage = 5;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (localStorage.getItem("data-auth-eduiteh-food")) {
        try {
          const response = await axios.get("/api/auth/user", {
            headers: {
              "x-auth-token": localStorage.getItem("data-auth-eduiteh-food"),
            },
          });
          setUser(response.data);
          if (response.data.role !== "admin") {
            window.location.href = "/dashboard";
          }
        } catch (error) {
          setError("Error fetching user profile");
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setUser(null);
        window.location.href = "/dashboard";
      }
    };

    fetchUserProfile();
  }, []);

  const fetchArchivedOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await axios.get("/api/archived-orders", {
        headers: authHeaders(),
      });

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
  }, [searchTerm, selectedClass, selectedWeek]);

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
        { headers: authHeaders() },
      );
      await fetchArchivedOrders();
    } catch (err) {
      alert(err.response?.data?.message ?? "Грешка при обновяване!");
    } finally {
      setTogglingKey(null);
    }
  };

  const handleDelete = async (orderId) => {
    if (
      !confirm("Сигурни ли сте, че искате да изтриете тази архивирана поръчка?")
    )
      return;
    setDeletingId(orderId);
    try {
      await axios.delete(`/api/archived-orders/${orderId}`, {
        headers: authHeaders(),
      });
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

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-600 font-medium">Грешка</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <button
            onClick={fetchArchivedOrders}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Опитай отново
          </button>
        </div>
      </div>
    );
  }

  const classes = [...new Set(rows.map((r) => r.grade))];

  const weeks = [
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
  ];

  const filteredRows = rows.filter((r) => {
    const matchesName = (r.fullName || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass ? r.grade === selectedClass : true;
    const matchesWeek = selectedWeek
      ? weekKey(r.weekStart, r.weekEnd) === selectedWeek
      : true;
    return matchesName && matchesClass && matchesWeek;
  });

  const totalPages = Math.ceil(filteredRows.length / ordersPerPage);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage,
  );

  return (
    <div className="min-h-screen">
      <SidebarNav user={user} />
      <main className="lg:pl-64">
        <div className="p-8 min-h-screen bg-gray-50">
          <h1 className="text-3xl font-bold mb-6">Архивирани поръчки</h1>

          {/* Filters */}
          <div className="flex flex-row items-center justify-center gap-2 mb-4">
            <input
              type="text"
              placeholder="Търси по име..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-3 border rounded-full w-full outline-none focus:ring-2 focus:ring-[#478BAF] focus:border-[#478BAF]"
            />
            <div className="flex gap-2">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="p-3 border rounded-full outline-none focus:ring-2 focus:ring-[#478BAF] focus:border-[#478BAF]"
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
                className="p-3 border rounded-full outline-none focus:ring-2 focus:ring-[#478BAF] focus:border-[#478BAF]"
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

          {filteredRows.length === 0 ? (
            <p>Няма намерени архивирани поръчки.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Име</th>
                    <th className="border p-2">Клас</th>
                    <th className="border p-2">Седмица</th>
                    <th className="border p-2">Поръчка</th>
                    <th className="border p-2">Сума (€)</th>
                    <th className="border p-2">Действия</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.orderId} className="border-b">
                      <td className="border p-2">{row.fullName}</td>
                      <td className="border p-2">{row.grade}</td>

                      <td className="border p-2 whitespace-nowrap text-sm">
                        {formatDate(row.weekStart)} → {formatDate(row.weekEnd)}
                      </td>

                      <td className="border p-2">
                        {DAYS.map((day) => {
                          const dayData = row.dayMeals[day];
                          const meals = dayData.meals;
                          const got = dayData.orderGot;
                          const toggleKey = `${row.orderId}-${day}`;
                          const isToggling = togglingKey === toggleKey;
                          const hasOrder = meals.length > 0;

                          if (!hasOrder) return null;

                          return (
                            <div key={day} className="mb-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <strong>{day}:</strong>
                                <span className="text-xs text-gray-700">
                                  Получено:
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    got
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {got ? (
                                    <>
                                      <Check className="w-4 h-4" /> Да
                                    </>
                                  ) : (
                                    <>
                                      <X className="w-4 h-4" /> Не
                                    </>
                                  )}
                                </span>
                                <button
                                  type="button"
                                  disabled={isToggling}
                                  onClick={() => handleToggleOrderGot(row, day)}
                                  className={`text-xs px-2 py-1 rounded border transition-colors disabled:opacity-50 ${
                                    got
                                      ? "border-red-300 hover:bg-red-50"
                                      : "border-green-300 hover:bg-green-50"
                                  }`}
                                >
                                  {isToggling ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : got ? (
                                    "Отмени"
                                  ) : (
                                    "Отбележи"
                                  )}
                                </button>
                              </div>

                              <ul className="ml-4 mt-1">
                                {meals.map((meal, i) => (
                                  <li key={i}>
                                    {meal.name} x {meal.quantity} = €
                                    {(
                                      (meal.price ?? 0) * (meal.quantity ?? 1)
                                    ).toFixed(2)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </td>

                      <td className="border p-2 font-bold">
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
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-300 disabled:opacity-50"
                        >
                          {deletingId === row.orderId ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Trash />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-[#478BAF] hover:bg-[#478BAF] transition-colors duration-300 hover:text-white rounded-lg disabled:opacity-50"
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
                  className="px-4 py-2 border border-[#478BAF] hover:bg-[#478BAF] transition-colors duration-300 hover:text-white rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
