"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/layout/Loader";
import { useRouter } from "next/navigation";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Loader2, Trash } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

const AdminOrdersPage = () => {
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState("");
  const [submiting, setSubmiting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedPaid, setSelectedPaid] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [menuId, setMenuId] = useState(null);

  const ordersPerPage = 5;
  const router = useRouter();

  const normalizeMealName = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("/api/auth/user");

        if (response.data.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        setUser(response.data);
      } catch (error) {
        setError("Error fetching user profile");
        console.error(error);
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    };

    const fetchMenu = async () => {
      const res = await axios.get("/api/menu");
      setMenuId(res.data?._id);
    };

    fetchUserProfile();
    fetchMenu();
  }, [router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass, selectedPaid, selectedRole]);

  const downloadFoodByClassCSV = () => {
    const classFoodMap = {};

    ordersData.forEach((user) => {
      const grade = user.grade;
      if (!classFoodMap[grade]) classFoodMap[grade] = {};

      user.orders.forEach((week) => {
        week.days.forEach((day) => {
          day.meals.forEach((meal) => {
            if (!classFoodMap[grade][meal.mealName]) {
              classFoodMap[grade][meal.mealName] = 0;
            }

            classFoodMap[grade][meal.mealName] += meal.quantity;
          });
        });
      });
    });

    const rows = [];
    rows.push(["Клас", "Ястие", "Бройка"]);

    Object.entries(classFoodMap).forEach(([grade, meals]) => {
      Object.entries(meals).forEach(([mealName, quantity]) => {
        rows.push([grade, mealName, quantity]);
      });
    });

    const csvContent = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\r\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "food-by-class.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const downloadMenuWithCountsCSV = async () => {
    try {
      const menuRes = await axios.get("/api/menu");
      const menu = menuRes.data;

      if (!menu?.menuFile) {
        toast.error("Няма запазен CSV файл (menuFile) към менюто.");
        return;
      }

      const DAY_BG = ["понеделник", "вторник", "сряда", "четвъртък", "петък"];

      const DAY_ALIASES = {
        monday: "понеделник",
        tuesday: "вторник",
        wednesday: "сряда",
        thursday: "четвъртък",
        friday: "петък",
        понеделник: "понеделник",
        вторник: "вторник",
        сряда: "сряда",
        четвъртък: "четвъртък",
        петък: "петък",
      };

      const normalizeMealName = (s) =>
        String(s || "")
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();

      const detectDayKey = (text) => {
        const t = normalizeMealName(text);
        for (const d of DAY_BG) if (t.includes(d)) return d;
        return DAY_ALIASES[t] || null;
      };

      const parseEuro = (v) => {
        const s = String(v ?? "")
          .replace(/\s/g, "")
          .replace("€", "")
          .replace(",", ".");

        const n = Number(s);
        return Number.isFinite(n) ? n : 0;
      };

      const formatEuro = (n) => `€${Number(n || 0).toFixed(2)}`;

      const totalsByDay = Object.fromEntries(DAY_BG.map((d) => [d, {}]));

      ordersData.forEach((user) => {
        user.orders.forEach((week) => {
          week.days.forEach((day) => {
            const dayKey = detectDayKey(day.day);
            if (!dayKey) return;

            day.meals.forEach((meal) => {
              const key = normalizeMealName(meal.mealName);
              if (!key) return;

              totalsByDay[dayKey][key] =
                (totalsByDay[dayKey][key] || 0) + (meal.quantity || 0);
            });
          });
        });
      });

      const parseCSV = (text) => {
        const rows = [];
        let row = [];
        let cell = "";
        let inQuotes = false;

        text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          const next = text[i + 1];

          if (ch === '"' && inQuotes && next === '"') {
            cell += '"';
            i++;
            continue;
          }

          if (ch === '"') {
            inQuotes = !inQuotes;
            continue;
          }

          if (!inQuotes && ch === ",") {
            row.push(cell);
            cell = "";
            continue;
          }

          if (!inQuotes && ch === "\n") {
            row.push(cell);
            rows.push(row);
            row = [];
            cell = "";
            continue;
          }

          cell += ch;
        }

        row.push(cell);
        rows.push(row);

        return rows;
      };

      const toCSV = (rows) =>
        rows
          .map((r) =>
            r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","),
          )
          .join("\r\n");

      const rows = parseCSV(menu.menuFile);

      let priceCol = -1;
      let qtyCol = -1;

      for (const r of rows) {
        const p = r.findIndex((c) => normalizeMealName(c) === "цена");
        const q = r.findIndex((c) => normalizeMealName(c) === "брой");

        if (p !== -1 && q !== -1) {
          priceCol = p;
          qtyCol = q;
          break;
        }
      }

      if (priceCol === -1) {
        toast.error('Не намерих колона "цена" в CSV файла.');
        return;
      }

      if (qtyCol === -1) {
        toast.error('Не намерих колона "брой" в CSV файла.');
        return;
      }

      const totalCol = qtyCol + 1;
      const mealNameCol = Math.max(priceCol - 2, 0);

      let currentDay = null;
      let daySum = 0;
      let dayQtySum = 0;
      let weekSum = 0;
      let weekQtySum = 0;

      const isLikelySubtotalRow = (r) => {
        const nameCell = normalizeMealName(r?.[mealNameCol]);
        const qtyCell = String(r?.[qtyCol] ?? "").trim();
        const totalCell = String(r?.[totalCol] ?? "").trim();

        return (
          !nameCell &&
          totalCell.includes("€") &&
          (qtyCell === "" || /^\d/.test(qtyCell))
        );
      };

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const cellText = r[mealNameCol];
        const norm = normalizeMealName(cellText);

        const detectedDay = detectDayKey(cellText);

        if (detectedDay) {
          currentDay = detectedDay;
          daySum = 0;
          dayQtySum = 0;
          continue;
        }

        if (norm && norm.includes("седмично меню")) {
          currentDay = null;
          continue;
        }

        if (currentDay) {
          if (isLikelySubtotalRow(r)) {
            if (!String(r[qtyCol] ?? "").trim()) {
              r[qtyCol] = String(dayQtySum);
            }

            r[totalCol] = formatEuro(daySum);
            continue;
          }

          if (norm) {
            const qty = totalsByDay[currentDay]?.[norm] || 0;
            r[qtyCol] = String(qty);

            const unitPrice = parseEuro(r[priceCol]);
            const rowTotal = unitPrice * qty;

            if (totalCol < r.length) r[totalCol] = formatEuro(rowTotal);

            dayQtySum += qty;
            daySum += rowTotal;
            weekQtySum += qty;
            weekSum += rowTotal;
          }
        }
      }

      for (let i = rows.length - 1; i >= 0; i--) {
        const r = rows[i];
        const hasEuroInPrice = String(r?.[priceCol] ?? "").includes("€");
        const hasEuroInTotal = String(r?.[totalCol] ?? "").includes("€");
        const nameCell = normalizeMealName(r?.[mealNameCol]);

        if (!nameCell && (hasEuroInPrice || hasEuroInTotal)) {
          if (priceCol < r.length) r[priceCol] = formatEuro(weekSum);
          if (qtyCol < r.length) r[qtyCol] = String(weekQtySum);
          if (totalCol < r.length) r[totalCol] = formatEuro(weekSum);
          break;
        }
      }

      const csvOut = toCSV(rows);
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvOut], {
        type: "text/csv;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = menu.menuFileName
        ? `filled-${menu.menuFileName.replace(/\.csv$/i, "")}.csv`
        : "menu-with-counts.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      toast.success("Фактурата за Бешамел е изтеглена!");
    } catch (e) {
      console.error(e);
      toast.error("Грешка при експортиране на менюто.");
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/api/orders");
      setOrdersData(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const markAsPaid = async (userId, orderId) => {
    try {
      setSubmiting(true);

      await axios.put(`/api/orders/paid/${userId}/${orderId}`, {});

      toast.success("Поръчката е означена като платена!");
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Грешка при означаването като платено!");
    } finally {
      setSubmiting(false);
    }
  };

  const deleteOrder = async (userId, orderId) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете тази поръчка?")) return;

    setSubmiting(true);

    try {
      await axios.delete(`/api/orders/${userId}/${orderId}?menuId=${menuId}`);

      toast.success("Поръчката е изтрита успешно!");
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Грешка при изтриването на поръчката!");
    } finally {
      setSubmiting(false);
    }
  };

  const downloadOrders = async () => {
    const url = `/api/orders/download?menuId=${encodeURIComponent(menuId)}`;

    const res = await fetch(url, { credentials: "include" });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message || "Failed to download file");
    }

    const blob = await res.blob();

    let filename = "orders.xlsx";
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

  const classes = [...new Set(ordersData.map((u) => u.grade))];

  const filteredOrders = ordersData.filter((u) => {
    const matchesName = (u.fullName || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass ? u.grade === selectedClass : true;

    const matchesPaid = (() => {
      if (!selectedPaid) return true;

      if (selectedPaid === "paid") {
        return u.orders.every((o) => o.paid === true);
      }

      if (selectedPaid === "unpaid") {
        return u.orders.some((o) => o.paid === false);
      }

      return true;
    })();

    const matchesRole = selectedRole
      ? selectedRole === "teacher"
        ? u.role === "teacher" || u.role === "admin"
        : u.role === selectedRole
      : true;

    return matchesName && matchesClass && matchesPaid && matchesRole;
  });

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage,
  );

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-background">
      <SidebarNav user={user} />

      <main className="min-h-screen transition-all duration-300 md:pl-[var(--sidebar-width,16rem)]">
        <div className="min-h-screen bg-gray-50 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="mb-6 text-2xl font-bold sm:text-3xl">Поръчки</h1>

            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
              <input
                type="text"
                placeholder="Търси по име..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full border p-3 outline-none focus:border-[#478BAF] focus:ring-2 focus:ring-[#478BAF]"
              />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto lg:min-w-[640px]">
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
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full rounded-full border p-3 outline-none focus:border-[#478BAF] focus:ring-2 focus:ring-[#478BAF]"
                >
                  <option value="">Всички роли</option>
                  <option value="student">Ученик</option>
                  <option value="teacher">Учител</option>
                </select>

                <select
                  value={selectedPaid}
                  onChange={(e) => setSelectedPaid(e.target.value)}
                  className="w-full rounded-full border p-3 outline-none focus:border-[#478BAF] focus:ring-2 focus:ring-[#478BAF]"
                >
                  <option value="">Всички плащания</option>
                  <option value="paid">Платени</option>
                  <option value="unpaid">Неплатени</option>
                </select>
              </div>
            </div>

            {ordersData.length !== 0 && (
              <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <ShinyButton
                  onClick={downloadFoodByClassCSV}
                  href="/"
                  className="w-full p-2"
                >
                  Изтегли поръчките (по клас)
                </ShinyButton>

                <ShinyButton
                  onClick={downloadMenuWithCountsCSV}
                  href="/"
                  className="w-full p-2"
                >
                  Изтегли фактура за Бешамел
                </ShinyButton>

                <ShinyButton
                  onClick={downloadOrders}
                  href="/"
                  className="w-full p-2 sm:col-span-2 xl:col-span-1"
                >
                  Изтегли поръчките за седмицата
                </ShinyButton>
              </div>
            )}

            {error && <p className="mb-4 text-red-500">{error}</p>}

            {filteredOrders.length === 0 ? (
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p>Няма намерени ученици.</p>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-[950px] w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="border p-2 text-left">Име</th>
                          <th className="border p-2 text-left">Клас</th>
                          <th className="border p-2 text-left">Поръчка</th>
                          <th className="border p-2 text-left">Сума (€)</th>
                          <th className="border p-2 text-center">Платено</th>
                          <th className="border p-2 text-center">Действия</th>
                        </tr>
                      </thead>

                      <tbody>
                        {paginatedOrders.map((u) =>
                          u.orders.map((week) => (
                            <tr
                              key={`${u._id}-${week._id}`}
                              className="border-b align-top"
                            >
                              <td className="border p-2 font-medium">
                                {u.fullName}
                              </td>

                              <td className="border p-2">{u.grade}</td>

                              <td className="border p-2">
                                <div className="space-y-3">
                                  {week.days.map((day) => (
                                    <div key={day.day}>
                                      <strong className="text-sm font-semibold capitalize">
                                        {day.day}
                                      </strong>

                                      <ul className="ml-4 mt-1 list-disc space-y-1">
                                        {day.meals.map((meal) => (
                                          <li key={meal.mealName}>
                                            {meal.mealName} x {meal.quantity} = €
                                            {(
                                              meal.price * meal.quantity
                                            ).toFixed(2)}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </td>

                              <td className="border p-2 font-bold whitespace-nowrap">
                                {new Intl.NumberFormat("de-DE", {
                                  style: "currency",
                                  currency: "EUR",
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }).format(week.totalPrice)}
                              </td>

                              <td className="border p-2 text-center">
                                {week.paid ? (
                                  <div className="flex flex-col gap-2 font-bold text-green-600">
                                    <div>Платено</div>

                                    {week.approvedBy?.fullName && (
                                      <div className="text-xs font-normal text-gray-600">
                                        Одобрил: {week.approvedBy.fullName}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => markAsPaid(u._id, week._id)}
                                    disabled={submiting}
                                    className="inline-flex w-full items-center justify-center rounded bg-blue-600 px-3 py-2 text-white transition-colors duration-300 hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
                                  >
                                    {submiting ? (
                                      <Loader2 className="animate-spin" />
                                    ) : (
                                      <span>Маркирай като платено</span>
                                    )}
                                  </button>
                                )}
                              </td>

                              <td className="border p-2 text-center">
                                <button
                                  onClick={() => deleteOrder(u._id, week._id)}
                                  disabled={submiting}
                                  className="inline-flex items-center justify-center rounded bg-red-600 px-3 py-2 text-white transition-colors duration-300 hover:bg-red-700 disabled:opacity-50"
                                >
                                  {submiting ? (
                                    <Loader2 className="animate-spin" />
                                  ) : (
                                    <Trash size={18} />
                                  )}
                                </button>
                              </td>
                            </tr>
                          )),
                        )}
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
};

export default AdminOrdersPage;