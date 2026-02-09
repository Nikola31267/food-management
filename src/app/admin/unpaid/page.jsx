"use client";

import axios from "axios";
import { useEffect, useState } from "react";

export default function UnpaidPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Unpaid Orders</h1>

      <div style={{ marginTop: 12 }}>
        <button onClick={fetchOrders}>Refresh</button>
      </div>

      {loading && <p style={{ marginTop: 16 }}>Loading...</p>}
      {err && <p style={{ marginTop: 16, color: "red" }}>{err}</p>}

      {!loading && !err && (
        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 700,
            }}
          >
            <thead>
              <tr>
                <th style={th}>Name</th>
                <th style={th}>Grade</th>
                <th style={th}>Total</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td style={td} colSpan={5}>
                    No unpaid orders.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id}>
                    <td style={td}>{o.name}</td>
                    <td style={td}>{o.grade}</td>
                    <td style={td}>{o.total}</td>
                    <td style={td}>
                      <button onClick={() => deleteOrder(o._id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th = {
  border: "1px solid #ddd",
  padding: 10,
  textAlign: "left",
  background: "#f6f6f6",
};

const td = {
  border: "1px solid #ddd",
  padding: 10,
};
