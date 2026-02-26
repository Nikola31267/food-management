"use client";

import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import axios from "axios";
import { RefreshCw, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "@/components/layout/Loader";
import { Button } from "@/components/ui/button";

export default function UnpaidPage() {
  const [user, setUser] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Cookie sent automatically — no token needed
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
      // Cookie sent automatically — no token needed
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
      // Cookie sent automatically — no token needed
      await axios.delete(`/api/unpaid?id=${id}`);
      fetchOrders();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Network error");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarNav user={user} />

      <main
        style={{ paddingLeft: "var(--sidebar-width, 16rem)" }}
        className="transition-all duration-300"
      >
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

        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

        {!loading && !err && (
          <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
            <table className="min-w-[900px] w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-left text-sm font-semibold">
                    Ime
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
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="border px-3 py-4 text-center text-sm text-gray-500"
                    >
                      Няма неплатени поръчки.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
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
