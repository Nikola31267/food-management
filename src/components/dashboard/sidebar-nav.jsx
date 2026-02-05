"use client";

import { cn } from "@/lib/utils";
import { BarChart3, ClipboardList, Home, Users, Utensils } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Начало", href: "/", icon: Home },
  { name: "Статистика", href: "/admin/statistics", icon: BarChart3 },
  { name: "Поръчки", href: "/admin/orders", icon: ClipboardList },
  { name: "Меню", href: "/admin/menu", icon: Utensils },
  { name: "Ученици", href: "/admin/students", icon: Users },
];

export function SidebarNav({ user }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex min-h-0 flex-1 flex-col border-r border-border bg-card">
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          <div className="flex items-center gap-2 px-4">
            <Image
              src="/logo-nobg.png"
              alt="TurboVerify"
              width={48}
              height={48}
            />
            <span className="text-lg font-semibold text-foreground">
              {user?.fullName} {user?.grade}
            </span>
          </div>

          <nav className="mt-8 flex-1 space-y-1 px-3">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isCurrent =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isCurrent
                        ? "bg-[#478BAF] text-white"
                        : "text-muted-foreground hover:bg-[#478BAF] hover:text-white",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </aside>
  );
}
