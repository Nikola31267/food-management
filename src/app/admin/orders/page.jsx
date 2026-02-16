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
      if (localStorage.getItem("data-auth-eduiteh-food")) {
        try {
          const response = await axios.get("/api/auth/user", {
            headers: {
              "x-auth-token": localStorage.getItem("data-auth-eduiteh-food"),
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

    const fetchMenu = async () => {
      const res = await axios.get("/api/menu");
      console.log(res.data?._id)
      setMenuId(res.data?._id);
    };

    fetchUserProfile();
    fetchMenu();
  }, [router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass]);

  const downloadFoodByClassCSV = () => {
    const classFoodMap = {};

    ordersData.forEach((user) => {
      const grade = user.grade;
      if (!classFoodMap[grade]) classFoodMap[grade] = {};

      user.orders.forEach((week) => {
        week.days.forEach((day) => {
          day.meals.forEach((meal) => {
            if (!classFoodMap[grade][meal.mealName])
              classFoodMap[grade][meal.mealName] = 0;
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
            if (!String(r[qtyCol] ?? "").trim()) r[qtyCol] = String(dayQtySum);
            r[totalCol] = formatEuro(daySum);

            continue;
          }

          if (norm) {
            const mealKey = norm;
            const qty = totalsByDay[currentDay]?.[mealKey] || 0;

            r[qtyCol] = String(qty);

            const unitPrice = parseEuro(r[priceCol]);
            const rowTotal = unitPrice * qty;

            if (totalCol < r.length) {
              r[totalCol] = formatEuro(rowTotal);
            }

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
      const blob = new Blob([BOM + csvOut], { type: "text/csv;charset=utf-8" });

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
      const res = await axios.get("/api/orders", {
        headers: {
          "x-auth-token": localStorage.getItem("data-auth-eduiteh-food"),
        },
      });
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
      await axios.put(
        `/api/orders/paid/${userId}/${orderId}`,
        {},
        {
          headers: {
            "x-auth-token": localStorage.getItem("data-auth-eduiteh-food"),
          },
        },
      );
      toast.success("Поръчката е означена като платена!");
      fetchOrders();
      setSubmiting(false);
    } catch (err) {
      console.error(err);
      toast.error("Грешка при означаването като платено!");
    }
  };

  const deleteOrder = async (userId, orderId) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете тази поръчка?")) return;
    setSubmiting(true);

    try {
      await axios.delete(`/api/orders/${userId}/${orderId}?menuId=${menuId}`, {
        headers: {
          "x-auth-token": localStorage.getItem("data-auth-eduiteh-food"),
        },
      });
      toast.success("Поръчката е изтрита успешно!");
      fetchOrders();
      setSubmiting(false);
    } catch (err) {
      console.error(err);
      toast.error("Грешка при изтриването на поръчката!");
    }
  };

  const classes = [...new Set(ordersData.map((user) => user.grade))];

  const filteredOrders = ordersData.filter((user) => {
    const matchesName = user.fullName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass ? user.grade === selectedClass : true;

    return matchesName && matchesClass;
  });

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage,
  );

const downloadOrders = async () => {
  const token = localStorage.getItem("data-auth-eduiteh-food");
  const url = `/api/orders/download?menuId=${encodeURIComponent(menuId)}`;

  const res = await fetch(url, { headers: { "x-auth-token": token } });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Failed to download file");
  }

  const blob = await res.blob();

  // backend sets fixed filename="orders.xlsx"
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


  if (loading) return <Loader />;

  return (
    <div className="min-h-screen">
      <SidebarNav user={user} />

      <main className="lg:pl-64">
        <div className="p-8 min-h-screen bg-gray-50">
          <h1 className="text-3xl font-bold mb-6">Поръчки</h1>

          <div className="flex flex-row gap-2">
            <input
              type="text"
              placeholder="Търси по име..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4 p-3 border rounded-full w-full outline-none focus:ring-2 focus:ring-[#478BAF] focus:border-[#478BAF]"
            />
            <div>
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
            </div>
          </div>
          {ordersData.length !== 0 && (
            <div className="flex gap-2">
              <ShinyButton
                onClick={downloadFoodByClassCSV}
                href="/"
                className="p-2 mb-2 mt-2"
              >
                Изтегли поръчките (по клас)
              </ShinyButton>

              <ShinyButton
                onClick={downloadMenuWithCountsCSV}
                href="/"
                className="p-2 mb-2 mt-2"
              >
                Изтегли фактура за Бешамел
              </ShinyButton>
            <ShinyButton
                onClick={downloadOrders}
                href="/"
                className="p-2 mb-2 mt-2"
              >
                Изтегли поръчките за седмицата
              </ShinyButton>
            </div>
          )}

          {error && <p className="text-red-500 mb-4">{error}</p>}

          {filteredOrders.length === 0 ? (
            <p>Няма намерени ученици.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Име</th>
                    <th className="border p-2">Клас</th>
                    <th className="border p-2">Поръчка</th>
                    <th className="border p-2">Сума (€)</th>
                    <th className="border p-2">Платено</th>
                    <th className="border p-2">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((user) =>
                    user.orders.map((week) => (
                      <tr key={`${user._id}-${week._id}`} className="border-b">
                        <td className="border p-2">{user.fullName}</td>
                        <td className="border p-2">{user.grade}</td>
                        <td className="border p-2">
                          {week.days.map((day) => (
                            <div key={day.day} className="mb-2">
                              <strong>{day.day}:</strong>
                              <ul className="ml-4">
                                {day.meals.map((meal) => (
                                  <li key={meal.mealName}>
                                    {meal.mealName} x {meal.quantity} = €
                                    {meal.price * meal.quantity}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </td>
                        <td className="border p-2 font-bold">
                          <span>
                            {new Intl.NumberFormat("de-DE", {
                              style: "currency",
                              currency: "EUR",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(week.totalPrice)}
                          </span>
                        </td>
                        <td className="border p-2 text-center">
                          {week.paid ? (
                            <div className="text-green-600 font-bold flex flex-col gap-4">
                              <div>Платено</div>

                              {week.approvedBy?.fullName && (
                                <div className="text-xs font-normal text-gray-600">
                                  Одобрил: {week.approvedBy.fullName}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => markAsPaid(user._id, week._id)}
                              disabled={submiting}
                              className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-300"
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
                            onClick={() => deleteOrder(user._id, week._id)}
                            disabled={submiting}
                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-300"
                          >
                            {submiting ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <Trash />
                            )}
                          </button>
                        </td>
                      </tr>
                    )),
                  )}
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
};

export default AdminOrdersPage;
