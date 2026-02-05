"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DashboardHeader() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();

    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Статистика</h1>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="icon"
          disabled={refreshing}
          className="border-border bg-[#478BAF] text-white hover:bg-[#317faa] hover:text-white transition-colors duration-300"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
    </div>
  );
}
