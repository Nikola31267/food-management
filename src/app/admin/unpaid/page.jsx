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
  }, []);

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

  // Derive unique grades from orders for the filter dropdown
  const gradeOptions = useMemo(() => {
    const grades = [
      ...new Set(orders.map((o) => o.grade).filter(Boolean)),
    ].sort();
    return grades;
  }, [orders]);

  // Apply search + grade filter
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

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarNav user={user} />

      <main
        style={{ paddingLeft: "var(--sidebar-width, 16rem)" }}
        className="transition-all duration-300 ml-4"
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Неплатени Поръчки</h1>

          <Button
            onClick={fetchOrders}
            variant="outline"
            size="icon"
            disabled={fetching}
            className="border-border bg-[#478BAF] text-white hover:bg-[#317faa] hover:text-white transition-colors duration-300"
          >
            <RefreshCw
              className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Search + Filter row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Търси по име, имейл, седмица…"
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#478BAF] focus:border-transparent transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Class / Grade filter */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="py-2 pl-3 pr-8 text-sm border border-gray-200 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#478BAF] focus:border-transparent transition appearance-none cursor-pointer"
          >
            <option value="all">Всички класове</option>
            {gradeOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Active filter count badge */}
          {(search || selectedGrade !== "all") && (
            <span className="text-xs text-gray-500">
              {filteredOrders.length} от {orders.length} записа
            </span>
          )}

          {/* Clear all filters */}
          {(search || selectedGrade !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedGrade("all");
              }}
              className="text-xs text-[#478BAF] hover:underline"
            >
              Изчисти филтрите
            </button>
          )}
        </div>

        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

        {!loading && !err && (
          <div className="mt-2 overflow-x-auto rounded-lg border bg-white">
            <table className="min-w-[900px] w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-left text-sm font-semibold">
                    Име
                  </th>
                  <th className="border px-3 py-2 text-left text-sm font-semibold">
                    Клас
                  </th>
                  <th className="border px-3 py-2 text-left text-sm font-semibold">
                    Имейл
                  </th>
                  <th className="border px-3 py-2 text-left text-sm font-semibold">
                    Седмица
                  </th>
                  <th className="border px-3 py-2 text-left text-sm font-semibold">
                    Дължима сума
                  </th>
                  <th className="border px-3 py-2 text-left text-sm font-semibold">
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
                        {new Intl.NumberFormat("de-DE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(o.total)}{" "}
                        €
                      </td>
                      <td className="border px-3 py-2 text-sm">
                        <button
                          onClick={() => deleteOrder(o._id)}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-300"
                        >
                          <Trash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
