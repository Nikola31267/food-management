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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function SidebarNav({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "4rem" : "16rem",
    );
  }, [collapsed]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleLogout = async () => {
    await axios.post("/api/auth/sign-out");
    router.push("/sign-in");
  };

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  const navigation = [
    { name: "Начало", href: "/", icon: Home },
    { name: "Статистика", href: "/admin/statistics", icon: BarChart3 },
    { name: "Меню", href: "/admin/menu", icon: Utensils },
    { name: "Поръчки", href: "/admin/orders", icon: ClipboardList },
    { name: "Неплатени поръчки", href: "/admin/unpaid", icon: Euro },
    {
      name: "Поръчки за даване",
      href: "/admin/orders-to-give",
      icon: Utensils,
    },
    { name: "Бройка", href: "/admin/verify-count", icon: Package },
    { name: "Ученици", href: "/admin/students", icon: Users },
  ];

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const BrandRow = ({ isCollapsed = false }) => (
    <div
      className={cn(
        "flex items-center gap-3 px-4",
        isCollapsed && "justify-center px-2",
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#478BAF]/10">
        <Image
          src="/logo-nobg.png"
          draggable={false}
          alt="Logo"
          width={34}
          height={34}
          className="shrink-0"
        />
      </div>

      {!isCollapsed && (
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-foreground">
            {user?.fullName || "Потребител"}
          </h1>
          {user?.grade && (
            <p className="truncate text-xs text-muted-foreground">
              {user.grade}
            </p>
          )}
        </div>
      )}
    </div>
  );

  const NavLinks = ({ onNavigate, isCollapsed = false }) => (
    <nav className="mt-6 flex-1 space-y-1 px-3">
      {navigation.map((item) => {
        const current = isActive(item.href);

        return (
          <div key={item.name} className="relative group/tooltip">
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isCollapsed && "justify-center px-2",
                current
                  ? "bg-[#478BAF] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-[#478BAF]/10 hover:text-[#478BAF]",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>

            {isCollapsed && (
              <div
                className={cn(
                  "pointer-events-none absolute left-full top-1/2 z-[9999] ml-3 -translate-y-1/2",
                  "rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg",
                  "whitespace-nowrap opacity-0 -translate-x-1 scale-95",
                  "transition-all duration-150 ease-out",
                  "group-hover/tooltip:translate-x-0 group-hover/tooltip:scale-100 group-hover/tooltip:opacity-100",
                )}
              >
                {item.name}
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/70 bg-white/95 shadow-sm backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-foreground hover:bg-[#478BAF]/10"
            aria-label="Отвори меню"
          >
            <MenuIcon className="h-6 w-6" />
          </button>

          <div className="flex min-w-0 items-center gap-2">
            <Image src="/logo-nobg.png" alt="Logo" width={30} height={30} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {user?.fullName || "Потребител"}
              </p>
              {user?.grade && (
                <p className="truncate text-xs text-muted-foreground">
                  {user.grade}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#478BAF] hover:bg-[#478BAF]/10"
            aria-label="Изход"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />

        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col border-r border-border bg-white shadow-2xl transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between border-b border-border/70 px-1 py-4">
            <BrandRow isCollapsed={false} />

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mr-3 inline-flex h-10 w-10 items-center justify-center rounded-xl text-foreground hover:bg-[#478BAF]/10"
              aria-label="Затвори меню"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto pb-4">
            <NavLinks onNavigate={() => setOpen(false)} isCollapsed={false} />
          </div>

          <div className="border-t border-border/70 p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#478BAF] transition-colors hover:bg-[#478BAF]/10"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Изход</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden overflow-visible transition-all duration-300 ease-in-out lg:fixed lg:inset-y-0 lg:flex lg:flex-col",
          collapsed ? "lg:w-16" : "lg:w-64",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-visible border-r border-border bg-card">
          <div className="flex flex-1 flex-col overflow-visible pb-4 pt-5">
            <BrandRow isCollapsed={collapsed} />
            <NavLinks isCollapsed={collapsed} />
          </div>

          <div className="space-y-1 border-t px-3 py-3">
            <button
              onClick={handleLogout}
              title={collapsed ? "Изход" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#478BAF] transition-colors hover:bg-[#478BAF]/10",
                collapsed && "justify-center px-2",
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Изход</span>}
            </button>

            <button
              onClick={toggleCollapsed}
              title={collapsed ? "Разшири" : "Свий"}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-[#478BAF]/10 hover:text-[#478BAF]",
                collapsed && "justify-center px-2",
              )}
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5 shrink-0" />
              ) : (
                <>
                  <ChevronLeft className="h-5 w-5 shrink-0" />
                  <span>Свий</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile spacer so page content does not hide behind header */}
      <div className="h-16 lg:hidden" />
    </>
  );
}