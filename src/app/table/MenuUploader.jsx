"use client";

import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";

const DAYS = ["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък"];

function normalizeCell(v) {
  if (v == null) return "";
  return String(v).trim();
}

function isLabelCell(s) {
  const t = s.toLowerCase().trim();
  // labels like сал.1, супа 2, осн.3, десерт 1 (BUT NOT "хляб" because it's a real item)
  return /^(сал|супа|осн|десерт)\.?\s*\d*/i.test(t);
}

function isWeightCell(s) {
  const raw = s.toLowerCase().trim();
  const t = raw.replace(/\s+/g, "");

  // common patterns: 250гр, 180 g, 0.5кг, 350ml, 1фил, 1 бр
  if (/^\d+([.,]\d+)?(гр|g|кг|kg|мл|ml|л|l)$/i.test(t)) return true;
  if (/^\d+\s*фил$/i.test(raw)) return true;
  if (/^\d+\s*бр$/i.test(raw)) return true;

  return false;
}

function toNumberMaybe(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = normalizeCell(v).replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function bestNameFromLeft(row, weightIdx) {
  for (let c = weightIdx - 1; c >= 0; c--) {
    const s = normalizeCell(row[c]);
    if (!s) continue;
    if (isLabelCell(s)) continue;

    // must contain letters (Cyrillic or Latin) to be a meal name
    if (!/[A-Za-zА-Яа-я]/.test(s)) continue;

    return s;
  }
  return "";
}

function parseMealsBetween(rows, startRow, endRow) {
  const meals = [];
  let breadAdded = false;

  for (let r = startRow; r < endRow; r++) {
    const row = rows[r] || [];

    // 1) find weight cell in this row
    let weightIdx = -1;
    for (let c = 0; c < row.length; c++) {
      const s = normalizeCell(row[c]);
      if (s && isWeightCell(s)) {
        weightIdx = c;
        break;
      }
    }

    // Normal rows (weight anchored)
    if (weightIdx !== -1) {
      const weight = normalizeCell(row[weightIdx]);

      // 2) price = first numeric-ish cell to the right of the weight cell
      let price = null;
      for (let c = weightIdx + 1; c < row.length; c++) {
        const n = toNumberMaybe(row[c]);
        if (n != null) {
          price = n;
          break;
        }
      }

      // 3) name = best text cell to the left of weight
      const name = bestNameFromLeft(row, weightIdx);
      if (!name) continue;

      // Avoid capturing header rows, etc.
      if (!weight && price == null) continue;

      meals.push({ name, weight, price });

      // if this row is bread, mark it so we don't add again in fallback
      if (name.toLowerCase() === "хляб") breadAdded = true;

      continue;
    }

    // Fallback: capture "хляб" even when it doesn't match weight pattern
    if (!breadAdded) {
      const breadIdx = row.findIndex(
        (v) => normalizeCell(v).toLowerCase() === "хляб",
      );
      if (breadIdx !== -1) {
        // Weight: first meaningful cell to the right that looks like count/weight
        let weight = "";
        for (let c = breadIdx + 1; c < row.length; c++) {
          const s = normalizeCell(row[c]);
          if (!s) continue;

          // accept: 1фил, 1 бр, 2 бр, 50гр, etc.
          if (isWeightCell(s) || /^\d+\s*(фил|бр)$/i.test(s.toLowerCase())) {
            weight = s;
            break;
          }
        }

        // Price: first numeric-ish cell to the right of "хляб"
        let price = null;
        for (let c = breadIdx + 1; c < row.length; c++) {
          const n = toNumberMaybe(row[c]);
          if (n != null) {
            price = n;
            break;
          }
        }

        meals.push({ name: "хляб", weight, price });
        breadAdded = true;
      }
    }
  }

  return meals;
}

function parseMenuFromRows(rows) {
  // Find day start rows
  const dayStarts = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || [];
    for (let c = 0; c < row.length; c++) {
      const cell = normalizeCell(row[c]);
      if (!cell) continue;

      const matchedDay = DAYS.find((d) => cell.includes(d));
      if (matchedDay) {
        dayStarts.push({ day: matchedDay, rowIndex: r });
        break;
      }
    }
  }

  dayStarts.sort((a, b) => a.rowIndex - b.rowIndex);

  const sections = dayStarts.map((entry, i) => {
    const start = entry.rowIndex + 1;
    const end =
      i < dayStarts.length - 1 ? dayStarts[i + 1].rowIndex : rows.length;

    return {
      day: entry.day,
      meals: parseMealsBetween(rows, start, end),
    };
  });

  // Ensure consistent output order (even if a day is missing)
  const byDay = new Map(sections.map((s) => [s.day, s]));
  return DAYS.map((d) => byDay.get(d) || { day: d, meals: [] });
}

function formatPrice(price) {
  if (price == null || Number.isNaN(price)) return "";
  return price.toFixed(2).replace(".", ",");
}

export default function MenuUploader() {
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState("");

  const hasAnyMeals = useMemo(() => {
    return (
      Array.isArray(menu) && menu.some((d) => d.meals && d.meals.length > 0)
    );
  }, [menu]);

  async function onFileChange(e) {
    setError("");
    setMenu(null);

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("Please upload an .xlsx file.");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];

      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: null,
        blankrows: false,
      });

      const parsed = parseMenuFromRows(rows);
      setMenu(parsed);
    } catch (err) {
      console.error(err);
      setError(
        "Failed to read the file. Make sure it is a valid .xlsx with the expected structure.",
      );
    }
  }

  return (
    <div>
      <input type="file" accept=".xlsx" onChange={onFileChange} />

      {error ? (
        <p style={{ marginTop: 12, color: "crimson" }}>{error}</p>
      ) : null}

      {!menu ? null : (
        <div style={{ marginTop: 18, display: "grid", gap: 18 }}>
          {!hasAnyMeals ? (
            <p style={{ color: "#666" }}>
              Parsed the file, but didn’t find meals under the day headers.
            </p>
          ) : null}

          {menu.map((dayBlock) => (
            <section
              key={dayBlock.day}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 10,
                padding: 14,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18 }}>{dayBlock.day}</h2>

              {dayBlock.meals.length === 0 ? (
                <p style={{ marginTop: 10, color: "#666" }}>No meals found.</p>
              ) : (
                <div style={{ overflowX: "auto", marginTop: 10 }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: 520,
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={th}>Ястие</th>
                        <th style={th}>Грамаж</th>
                        <th style={th}>Цена</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayBlock.meals.map((m, idx) => (
                        <tr key={`${m.name}-${idx}`}>
                          <td style={td}>{m.name}</td>
                          <td style={td}>{m.weight}</td>
                          <td style={{ ...td, textAlign: "right" }}>
                            {formatPrice(m.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "1px solid #ddd",
  fontWeight: 600,
  background: "#fafafa",
};

const td = {
  padding: "10px 8px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top",
};
