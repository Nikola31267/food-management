import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/models/User";
import { connectDB } from "@/lib/connectDB";
import { requireAdmin } from "@/lib/auth";
import ExcelJS from "exceljs";

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

export async function GET(req) {
  try {
    await connectDB();
    requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const menuId = searchParams.get("menuId");

    if (!menuId) {
      return NextResponse.json({ message: "Missing menuId" }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(menuId)) {
      return NextResponse.json({ message: "Invalid menuId" }, { status: 400 });
    }

    const users = await User.find(
      {},
      { fullName: 1, grade: 1, orders: 1, archivedOrders: 1 },
    ).lean();

    // ---- Build workbook
    const wb = new ExcelJS.Workbook();
    wb.creator = "Eduiteh Food";
    wb.created = new Date();

    const ws = wb.addWorksheet("Поръчки", {
      views: [{ state: "frozen", ySplit: 1 }], // freeze header row
      pageSetup: { fitToPage: true, fitToWidth: 1 },
    });

    // Columns
    ws.columns = [
      { header: "Име", key: "name" },
      { header: "Клас", key: "grade" },
      ...DAYS_BG.map((d) => ({ header: d, key: d })),
    ];

    // Header styling
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    headerRow.height = 22;

    // Add rows
    for (const user of users) {
      const current = (user.orders || []).find(
        (o) => String(o.menuId) === String(menuId),
      );

      let days = current?.days;

      if (!Array.isArray(days)) {
        const archived = (user.archivedOrders || []).find(
          (a) => String(a.menuId) === String(menuId),
        );
        const maybeWeekly = Array.isArray(archived?.orders) ? archived.orders[0] : null;
        days = archived?.days || maybeWeekly?.days;
      }

      const dayToMeals = {};
      for (const d of DAYS_BG) dayToMeals[d] = "";

      if (Array.isArray(days)) {
        for (const dayObj of days) {
          const dayName = dayObj?.day;
          if (!DAYS_BG.includes(dayName)) continue;
          dayToMeals[dayName] = formatMeals(dayObj?.meals || []);
        }
      }

      ws.addRow({
        name: user.fullName || "",
        grade: user.grade || "",
        ...Object.fromEntries(DAYS_BG.map((d) => [d, dayToMeals[d]])),
      });
    }

    // Style data cells (wrap & borders)
    ws.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (rowNumber === 1) return;

        // Wrap for meal columns, left align text
        cell.alignment = {
          vertical: "top",
          horizontal: cell.colNumber <= 2 ? "left" : "left",
          wrapText: cell.colNumber > 2,
        };
      });
    });

    // Auto column widths (with caps)
    ws.columns.forEach((col, idx) => {
      let max = col.header?.length || 10;

      col.eachCell({ includeEmpty: true }, (cell) => {
        const v = cell.value == null ? "" : String(cell.value);
        max = Math.max(max, v.length);
      });

      // Make name/grade smaller; day columns wider but capped
      if (idx === 0) col.width = Math.min(Math.max(max + 2, 18), 32); // Име
      else if (idx === 1) col.width = Math.min(Math.max(max + 2, 10), 14); // Клас
      else col.width = Math.min(Math.max(max + 2, 22), 50); // days
    });

    // Slightly increase row heights if text is long (basic)
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      let needsMore = false;
      row.eachCell((cell) => {
        if (cell.colNumber > 2 && String(cell.value || "").length > 40) {
          needsMore = true;
        }
      });
      if (needsMore) row.height = 40;
    });

    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="orders.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err?.message || "Server error";
    const status = msg === "Unauthorized" ? 401 : err?.status || 500;
    return NextResponse.json({ message: msg }, { status });
  }
}

