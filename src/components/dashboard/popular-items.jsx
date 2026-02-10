"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const chartConfig = {
  orders: { label: "Orders", color: "#478BAF" },
};

function TruncatedTick({ x, y, payload }) {
  const maxChars = 22;
  const full = String(payload?.value ?? "");
  const short =
    full.length > maxChars ? full.slice(0, maxChars - 1) + "…" : full;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        textAnchor="end"
        dominantBaseline="middle"
        fill="#71717a"
        fontSize={12}
        style={{ pointerEvents: "auto" }}
      >
        {short}
        {full.length > maxChars && <title>{full}</title>}
      </text>
    </g>
  );
}

function OrdersOnlyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const orders = payload[0]?.value;

  return (
    <div className="rounded-md border bg-white text-black px-2 py-1 text-xs shadow-md">
      {orders}
    </div>
  );
}

export function PopularItems() {
  const [popularItems, setPopularItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/top-meals", {
          headers: {
            "x-auth-token": localStorage.getItem("data-auth-eduiteh-food"),
          },
        });

        const meals = Array.isArray(data) ? data : [];
        const mapped = meals.slice(0, 5).map((m) => ({
          name: m.mealName,
          orders: Number(m.count || 0),
        }));

        if (mounted) setPopularItems(mapped);
      } catch (e) {
        console.error("Failed to fetch /api/top-meals:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const chartHeight = useMemo(() => {
    const rows = Math.max(popularItems.length || 0, 5);
    return Math.min(340, Math.max(240, rows * 56));
  }, [popularItems.length]);

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-foreground">
          Топ 5 най-поръчвани
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="w-full"
          style={{ height: chartHeight }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={popularItems}
              layout="vertical"
              margin={{ left: 32, right: 24, top: 8, bottom: 8 }}
              barCategoryGap={14}
            >
              <XAxis
                type="number"
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />

              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={180}
                tick={(props) => <TruncatedTick {...props} />}
              />

              {/* Tooltip shows only the number */}
              <ChartTooltip cursor={false} content={<OrdersOnlyTooltip />} />

              <Bar
                dataKey="orders"
                fill="#478BAF"
                radius={[0, 8, 8, 0]}
                barSize={26}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {loading && (
          <div className="mt-3 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
          </div>
        )}

        {!loading && popularItems.length === 0 && (
          <div className="mt-3 text-sm text-muted-foreground">
            No meal data found yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
