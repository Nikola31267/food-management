"use client";

import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import axios from "axios";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UnpaidPage() {
  const [user, setUser] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("data-auth-eduiteh-food");
        if (!token) return router.push("/sign-in");

        const userRes = await axios.get("/api/auth/user", {
          headers: { "x-auth-token": token },
        });

        if (userRes.data.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        setUser(userRes.data);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const fetchOrders = async () => {
    setLoading(true);
    setErr("");
    try {
      const token = localStorage.getItem("data-auth-eduiteh-food");

      const res = await axios.get("/api/unpaid", {
        headers: { "x-auth-token": token },
      });

      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Network error");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (id) => {
    if (!confirm("Delete this unpaid order?")) return;

    try {
      const token = localStorage.getItem("data-auth-eduiteh-food");

      await axios.delete(`/api/unpaid?id=${id}`, {
        headers: { "x-auth-token": token },
      });

      fetchOrders();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Network error");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarNav user={user} />

      <main className="lg:pl-64 p-6 ml-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Unpaid Orders</h1>

          <button
            onClick={fetchOrders}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {loading && <p className="mt-4 text-sm text-gray-600">Loading...</p>}

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
                      No unpaid orders.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o._id} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 text-sm">{o.name}</td>
                      <td className="border px-3 py-2 text-sm">{o.grade}</td>
                      <td className="border px-3 py-2 text-sm font-bold">
                        {o.total} €
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
