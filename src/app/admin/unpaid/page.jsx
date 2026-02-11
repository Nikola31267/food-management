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
      if (localStorage.getItem("data-auth-eduiteh-food")) {
        try {
          const response = await axios.get("/api/auth/user", {
            headers: {
              "x-auth-token": localStorage.getItem("data-auth-eduiteh-food"),
            },
          });
          setUser(response.data);
          if (response.data.role != "admin") {
            router.push("/dashboard");
          }
        } catch (error) {
          setErr("Error fetching user profile");
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setUser(null);
        router.push("/dashboard");
      }
    };

    fetchUserProfile();
  }, []);

  const fetchOrders = async () => {
    setFetching(true);
    setErr("");
    try {
      const res = await axios.get("/api/unpaid", {
        headers: {
          "x-auth-token": localStorage.getItem("data-auth-eduiteh-food"),
        },
      });

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
      await axios.delete(`/api/unpaid?id=${id}`, {
        headers: {
          "x-auth-token": localStorage.getItem("data-auth-eduiteh-food"),
        },
      });

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

      <main className="lg:pl-64 p-6 ml-6">
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
            <table className="min-w-[700px] w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-left text-sm font-semibold">
                    Име
                  </th>
                  <th className="border px-3 py-2 text-left text-sm font-semibold">
                    Клас
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
                      colSpan={4}
                      className="border px-3 py-4 text-center text-sm text-gray-500"
                    >
                      Няма неплатени поръчки.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o._id} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 text-sm">{o.name}</td>
                      <td className="border px-3 py-2 text-sm">{o.grade}</td>
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
