import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/models/User";
import { connectDB } from "@/lib/connectDB";
import { requireAdmin } from "@/lib/auth";

const DAYS_BG = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"];

function formatMeals(meals = []) {
  if (!Array.isArray(meals) || meals.length === 0) return "";

  const map = new Map();
  for (const m of meals) {
    const name = String(m?.mealName ?? "").trim();
    if (!name) continue;
    const qty = Number(m?.quantity ?? 1) || 1;
    map.set(name, (map.get(name) || 0) + qty);
  }

  return Array.from(map.entries())
    .map(([name, qty]) => `${name} x${qty}`)
    .join("; ");
}

function csvEscape(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req) {
  try {
    await connectDB();

    // ✅ admin only
    requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const menuId = searchParams.get("menuId");

    if (!menuId) {
      return NextResponse.json({ message: "Missing menuId" }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(menuId)) {
      return NextResponse.json({ message: "Invalid menuId" }, { status: 400 });
    }

    // Only fetch needed fields
    const users = await User.find(
      {},
      { fullName: 1, grade: 1, orders: 1, archivedOrders: 1 },
    ).lean();

    const rows = [];
    rows.push(["Име", "Клас", ...DAYS_BG]); // header

    for (const user of users) {
      // 1) current weekly orders for menuId
      const current = (user.orders || []).find(
        (o) => String(o.menuId) === String(menuId),
      );

      let days = current?.days;

      // 2) fallback archived
      if (!Array.isArray(days)) {
        const archived = (user.archivedOrders || []).find(
          (a) => String(a.menuId) === String(menuId),
        );
        const maybeWeekly = Array.isArray(archived?.orders)
          ? archived.orders[0]
          : null;

        days = archived?.days || maybeWeekly?.days;
      }

      // If user has no order for that menu/week — still include them as empty row (optional).
      // If you prefer to SKIP users without orders, replace this block with `if (!Array.isArray(days)) continue;`
      const dayToMeals = {};
      for (const d of DAYS_BG) dayToMeals[d] = "";

      if (Array.isArray(days)) {
        for (const dayObj of days) {
          const dayName = dayObj?.day;
          if (!DAYS_BG.includes(dayName)) continue;
          dayToMeals[dayName] = formatMeals(dayObj?.meals || []);
        }
      }

      rows.push([
        user.fullName || "",
        user.grade || "",
        ...DAYS_BG.map((d) => dayToMeals[d]),
      ]);
    }

    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");

    // UTF-8 BOM for Excel Cyrillic
    const body = "\uFEFF" + csv;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        // ✅ fixed name
        "Content-Disposition": `attachment; filename="orders.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err?.message || "Server error";
    const status = msg === "Unauthorized" ? 401 : err?.status || 500;
    return NextResponse.json({ message: msg }, { status });
  }
}

