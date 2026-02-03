"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import Loader from "@/components/layout/Loader";
import { useRouter } from "next/navigation";
import Navbar from "@/components/admin/Navbar";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Loader2, Trash } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";

const AdminOrdersPage = () => {
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState("");
  const [submiting, setSubmiting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (localStorage.getItem("data-traffic-auth")) {
        try {
          const response = await axios.get("/api/auth/user", {
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass]);

  const downloadFoodByClassCSV = () => {
    const classFoodMap = {};

    ordersData.forEach((user) => {
      const grade = user.grade;

      if (!classFoodMap[grade]) {
        classFoodMap[grade] = {};
      }

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
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "food-by-class.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/api/orders", {
        headers: { "x-auth-token": localStorage.getItem("data-traffic-auth") },
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
            "x-auth-token": localStorage.getItem("data-traffic-auth"),
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
      await axios.delete(`/api/orders/${userId}/${orderId}`, {
        headers: {
          "x-auth-token": localStorage.getItem("data-traffic-auth"),
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

  if (loading) return <Loader />;

  return (
    <>
      <Navbar user={user} />
      <div className="p-8 min-h-screen bg-gray-50">
        <h1 className="text-3xl font-bold mb-6">Поръчки</h1>

        <input
          type="text"
          placeholder="Търси по име..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4 p-3 border rounded-full w-full outline-none focus:ring-2 focus:ring-[#478BAF] focus:border-[#478BAF]"
        />

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

        {ordersData.length !== 0 && (
          <ShinyButton
            onClick={downloadFoodByClassCSV}
            href="/"
            className="p-2 mb-2 mt-2"
          >
            Експортирай поръчките
          </ShinyButton>
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
                          <span className="text-green-600 font-bold">
                            Платено
                          </span>
                        ) : (
                          <button
                            onClick={() => markAsPaid(user._id, week._id)}
                            disabled={submiting}
                            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
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
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
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
    </>
  );
};

export default AdminOrdersPage;
