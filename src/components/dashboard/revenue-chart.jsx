"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";

const revenueData = [
  { time: "8 AM", revenue: 120 },
  { time: "9 AM", revenue: 450 },
  { time: "10 AM", revenue: 320 },
  { time: "11 AM", revenue: 680 },
  { time: "12 PM", revenue: 1250 },
  { time: "1 PM", revenue: 890 },
  { time: "2 PM", revenue: 420 },
  { time: "3 PM", revenue: 580 },
  { time: "4 PM", revenue: 310 },
  { time: "5 PM", revenue: 190 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#3b82f6",
  },
};

export function RevenueChart() {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-foreground">
            Today&apos;s Revenue
          </CardTitle>
          <div className="text-right">
            <div className="text-lg font-semibold text-foreground">$5,210</div>
            <div className="text-xs text-muted-foreground">
              +12.5% from yesterday
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <LineChart data={revenueData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              stroke="#71717a"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#71717a"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{
                stroke: "#3b82f6",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6" }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
