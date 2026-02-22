"use client";

import { cn } from "@/lib/utils";
import axios from "axios";
import {
  BarChart3,
  ClipboardList,
  Home,
  Users,
  Utensils,
  LogOut,
  Menu as MenuIcon,
  X,
  Euro,
  Package,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function SidebarNav({ user }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("data-auth-eduiteh-food");
    window.location.reload();
  };

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const navigation = [
    { name: "Начало", href: "/", icon: Home },
    { name: "Статистика", href: "/admin/statistics", icon: BarChart3 },
    { name: "Меню", href: "/admin/menu", icon: Utensils },
    { name: "Поръчки", href: "/admin/orders", icon: ClipboardList },
    { name: "Неплатени поръчки", href: "/admin/unpaid", icon: Euro },
    { name: "Orders to give", href: "/admin/orders-to-give", icon: Utensils },
    {
      name: "Бройка",
      href: "/admin/verify-count",
      icon: Package,
    },
    { name: "Ученици", href: "/admin/students", icon: Users },
  ];

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const NavLinks = ({ onNavigate }) => (
    <nav className="mt-6 flex-1 space-y-1 px-3">
      {navigation.map((item) => {
        const isCurrent =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
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
    </nav>
  );

  const BrandRow = () => (
    <div className="flex items-center gap-2 px-4">
      <Image
        src="/logo-nobg.png"
        draggable={false}
        alt="TurboVerify"
        width={40}
        height={40}
      />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-foreground">
          <h1 className="min-w-0 truncate text-base sm:text-lg font-semibold">
            {user?.fullName} {user?.grade}
          </h1>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header className="lg:hidden fixed inset-x-0 top-0 z-40 border-b border-border bg-white">
        <div className="flex h-14 items-center justify-between px-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-[#478BAF]/10"
            aria-label="Отвори меню"
          >
            <MenuIcon className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-2">
            <Image
              src="/logo-nobg.png"
              alt="TurboVerify"
              width={28}
              height={28}
            />
            <span className="max-w-[55vw] truncate text-sm font-semibold text-foreground">
              {user?.fullName} {user?.grade}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-lg p-2 text-[#478BAF] hover:bg-[#478BAF]/10"
            aria-label="Изход"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div
        className={cn(
          "lg:hidden fixed inset-0 z-50",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "absolute inset-0 bg-white transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />

        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-card border-r border-border transition-transform",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between pt-5 pb-4">
              <BrandRow />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mr-2 rounded-lg p-2 text-foreground hover:bg-[#478BAF]/10"
                aria-label="Затвори меню"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto pb-4">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>

            <div className="border-t px-3 py-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#478BAF] hover:bg-[#478BAF]/20 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Изход
              </button>
            </div>
          </div>
        </aside>
      </div>

      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-border bg-card">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <BrandRow />
            <NavLinks />
          </div>

          <div className="border-t px-3 py-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#478BAF] hover:bg-[#478BAF]/20 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Изход
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:hidden h-14" />
    </>
  );
}
