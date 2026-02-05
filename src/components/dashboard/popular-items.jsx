"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

const chartConfig = {
  orders: {
    label: "Orders",
    color: "#478BAF",
  },
};

export function PopularItems() {
  const [popularItems, setPopularItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/statistics");

        const meals = Array.isArray(data?.meals) ? data.meals : [];

        const mapped = meals.slice(0, 5).map((m) => ({
          name: m.mealName,
          orders: Number(m.quantityOrdered || 0),
        }));

        if (!mounted) return;
        setPopularItems(mapped);
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

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-foreground">
          Топ 5 най-поръчвани
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <BarChart
            data={popularItems}
            layout="vertical"
            margin={{ left: 0, right: 20 }}
          >
            <XAxis
              type="number"
              stroke="#71717a"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#71717a"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={120}
            />

            <ChartTooltip content={<ChartTooltipContent />} cursor={false} />

            <Bar
              dataKey="orders"
              fill="#478BAF"
              radius={[0, 4, 4, 0]}
              barSize={24}
            />
          </BarChart>
        </ChartContainer>

        {!loading && popularItems.length === 0 && (
          <div className="mt-3 text-sm text-muted-foreground">
            No meal data found yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
