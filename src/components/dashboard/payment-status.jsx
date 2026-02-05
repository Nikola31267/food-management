// =======================
// payment-status.jsx
// =======================
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Cell, Pie, PieChart } from "recharts";

const chartConfig = {
  paid: { label: "Paid", color: "#22c55e" },
  pending: { label: "Pending", color: "#f59e0b" },
};

export function PaymentStatus() {
  const [summary, setSummary] = useState({
    paidOrders: 0,
    unpaidOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/statistics");
        if (!mounted) return;
        setSummary({
          paidOrders: data?.summary?.paidOrders || 0,
          unpaidOrders: data?.summary?.unpaidOrders || 0,
        });
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

  const paymentData = [
    { name: "Платени", value: summary.paidOrders, color: "#22c55e" },
    { name: "Неплатени", value: summary.unpaidOrders, color: "#f59e0b" },
  ];

  const total = paymentData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-foreground">
          Статус на плащанията
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto h-[200px] w-full"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={paymentData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              strokeWidth={0}
            >
              {paymentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="mt-4 space-y-3">
          {paymentData.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{item.name}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-medium text-foreground">
                  {loading ? "…" : item.value}
                </span>
                <span className="text-muted-foreground">
                  {total === 0
                    ? "(0.0%)"
                    : `(${((item.value / total) * 100).toFixed(1)}%)`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
