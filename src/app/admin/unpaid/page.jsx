"use client";

import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import axios from "axios";
import { RefreshCw, Trash, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Loader from "@/components/layout/Loader";
import { Button } from "@/components/ui/button";

export default function UnpaidPage() {
  const [user, setUser] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("/api/auth/user");
        setUser(response.data);

        if (response.data.role !== "admin") {
          router.push("/dashboard");
        }
      } catch (error) {
        setErr("Error fetching user profile");
        console.error(error);
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const fetchOrders = async () => {
    setFetching(true);
    setErr("");

    try {
      const res = await axios.get("/api/unpaid");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Network error");
      setOrders([]);
    } finally {
      setFetching(false);
    }
  };

  const deleteOrder = async (id) => {
    if (!confirm("Искате ли да изтриете неплатения запис?")) return;

    try {
      await axios.delete(`/api/unpaid?id=${id}`);
      fetchOrders();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Network error");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const gradeOptions = useMemo(() => {
    const grades = [...new Set(orders.map((o) => o.grade).filter(Boolean))];
    return grades.sort();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((o) => {
      const matchesGrade = selectedGrade === "all" || o.grade === selectedGrade;

      const matchesSearch =
        !q ||
        (o.name || "").toLowerCase().includes(q) ||
        (o.email || "").toLowerCase().includes(q) ||
        (o.week || "").toLowerCase().includes(q);

      return matchesGrade && matchesSearch;
    });
  }, [orders, search, selectedGrade]);

  const formatTotal = (total) => {
    return new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(total || 0);
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarNav user={user} />

      <main
        className="
          transition-all duration-300
          px-4 py-4
          sm:px-6 sm:py-6
          lg:pl-[var(--sidebar-width,16rem)]
        "
      >
        <div className="mx-auto w-full max-w-7xl">
          {/* Header */}
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">
                Неплатени Поръчки
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Преглед и управление на неплатените записи.
              </p>
            </div>

            <Button
              onClick={fetchOrders}
              variant="outline"
              size="icon"
              disabled={fetching}
              className="
                shrink-0 border-border bg-[#478BAF] text-white
                transition-colors duration-300
                hover:bg-[#317faa] hover:text-white
                disabled:cursor-not-allowed disabled:opacity-70
              "
            >
              <RefreshCw
                className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {/* Search + filters */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:max-w-sm sm:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Търси по име, имейл, седмица…"
                className="
                  w-full rounded-full border border-gray-200 bg-white
                  py-3 pl-10 pr-10 text-sm shadow-sm
                  outline-none transition
                  focus:border-transparent focus:ring-2 focus:ring-[#478BAF]
                "
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="
                w-full cursor-pointer appearance-none rounded-full
                border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm
                outline-none transition
                focus:border-transparent focus:ring-2 focus:ring-[#478BAF]
                sm:w-44
              "
            >
              <option value="all">Всички класове</option>
              {gradeOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {(search || selectedGrade !== "all") && (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-gray-500">
                  {filteredOrders.length} от {orders.length} записа
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedGrade("all");
                  }}
                  className="text-[#478BAF] hover:underline"
                >
                  Изчисти филтрите
                </button>
              </div>
            )}
          </div>

          {err && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {err}
            </div>
          )}

          {!loading && !err && (
            <>
              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {filteredOrders.length === 0 ? (
                  <div className="rounded-xl border bg-white p-4 text-center text-sm text-gray-500 shadow-sm">
                    {orders.length === 0
                      ? "Няма неплатени поръчки."
                      : "Няма резултати за избраните филтри."}
                  </div>
                ) : (
                  filteredOrders.map((o) => (
                    <div
                      key={o._id}
                      className="rounded-xl border bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {o.name || "—"}
                          </p>

                          <p className="mt-1 truncate text-sm text-gray-500">
                            {o.email || "—"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteOrder(o._id)}
                          className="
                            shrink-0 rounded-lg bg-red-600 p-2 text-white
                            transition-colors duration-300 hover:bg-red-700
                          "
                        >
                          <Trash size={18} />
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">Клас</p>
                          <p className="mt-1 font-medium">{o.grade || "—"}</p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">Седмица</p>
                          <p className="mt-1 font-medium">{o.week || "—"}</p>
                        </div>

                        <div className="col-span-2 rounded-lg bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">Дължима сума</p>
                          <p className="mt-1 text-lg font-bold">
                            {formatTotal(o.total)} €
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-xl border bg-white shadow-sm md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-3 py-3 text-left text-sm font-semibold">
                          Име
                        </th>
                        <th className="border px-3 py-3 text-left text-sm font-semibold">
                          Клас
                        </th>
                        <th className="border px-3 py-3 text-left text-sm font-semibold">
                          Имейл
                        </th>
                        <th className="border px-3 py-3 text-left text-sm font-semibold">
                          Седмица
                        </th>
                        <th className="border px-3 py-3 text-left text-sm font-semibold">
                          Дължима сума
                        </th>
                        <th className="border px-3 py-3 text-left text-sm font-semibold">
                          Действия
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="border px-3 py-4 text-center text-sm text-gray-500"
                          >
                            {orders.length === 0
                              ? "Няма неплатени поръчки."
                              : "Няма резултати за избраните филтри."}
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((o) => (
                          <tr key={o._id} className="hover:bg-gray-50">
                            <td className="border px-3 py-2 text-sm">
                              {o.name || "—"}
                            </td>
                            <td className="border px-3 py-2 text-sm">
                              {o.grade || "—"}
                            </td>
                            <td className="border px-3 py-2 text-sm">
                              {o.email || "—"}
                            </td>
                            <td className="border px-3 py-2 text-sm">
                              {o.week || "—"}
                            </td>
                            <td className="border px-3 py-2 text-sm font-bold">
                              {formatTotal(o.total)} €
                            </td>
                            <td className="border px-3 py-2 text-sm">
                              <button
                                type="button"
                                onClick={() => deleteOrder(o._id)}
                                className="
                                  rounded-lg bg-red-600 p-2 text-white
                                  transition-colors duration-300
                                  hover:bg-red-700
                                "
                              >
                                <Trash size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}