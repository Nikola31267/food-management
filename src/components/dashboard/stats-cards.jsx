"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, DollarSign, CreditCard, Euro } from "lucide-react";

function formatInt(value) {
  return Number(value || 0).toLocaleString("eu-EU");
}

function formatMoneyEuro(value) {
  const n = Number(value || 0);
  return (
    n.toLocaleString("eu-EU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

function StatCard({ title, value, icon }) {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  const [summary, setSummary] = useState({
    totalOrders: 0,
    paidOrders: 0,
    unpaidOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/statistics");
        if (!mounted) return;
        setSummary(
          data?.summary || {
            totalOrders: 0,
            paidOrders: 0,
            unpaidOrders: 0,
            totalRevenue: 0,
          },
        );
      } catch (e) {
        console.error("Failed to fetch /api/statistics:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = [
    {
      title: "Всички поръчки",
      value: loading ? "…" : formatInt(summary.totalOrders),
      icon: <ShoppingCart className="h-4 w-4" />,
      change: null,
      trend: null,
    },
    {
      title: "Обща цена",
      value: loading ? "…" : formatMoneyEuro(summary.totalRevenue),
      icon: <Euro className="h-4 w-4" />,
      change: null,
      trend: null,
    },
    {
      title: "Платени поръчки",
      value: loading ? "…" : formatInt(summary.paidOrders),
      icon: <CreditCard className="h-4 w-4" />,
      change: null,
      trend: null,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
