// ✅ Next.js (App Router) — JavaScript version
// Upload PDF → Read text → Convert to CSV → Debug log
// Works with menu-style PDFs

// ================================
// 1️⃣ Install dependency
// ================================
// npm install pdfjs-dist

// ================================
// 2️⃣ app/page.js
// ================================

"use client";

import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function Home() {
  const [csv, setCsv] = useState("");

  const handleUpload = async (file) => {
    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const pageText = content.items.map((item) => item.str).join(" ");

      fullText += pageText + "\n";
    }

    // ✅ DEBUG LOG — RAW PDF TEXT
    console.log("📘 RAW PDF TEXT:");
    console.log(fullText);

    // ================================
    // 3️⃣ Convert text → rows
    // ================================

    const lines = fullText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const rows = [];

    for (const line of lines) {
      // example: сал.1 Салата Гръцка голяма 250гр €3,22
      const match = line.match(/(€\s?\d+,\d+)/);

      if (match) {
        const price = match[1];
        const name = line.replace(price, "").trim();

        rows.push([name, price.replace("€", "").trim()]);

        // ✅ DEBUG EACH ITEM
        console.log("🧾 PARSED ROW:", { name, price });
      }
    }

    // ================================
    // 4️⃣ Convert to CSV
    // ================================

    const csvContent = [["Item", "Price"], ...rows]
      .map((r) => r.join(","))
      .join("\n");

    console.log("📊 FINAL CSV:\n", csvContent);

    setCsv(csvContent);
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>PDF → CSV Menu Parser</h1>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
          }
        }}
      />

      <pre style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>{csv}</pre>
    </main>
  );
}

// ================================
// ✅ DEBUG OUTPUT
// ================================
// • RAW extracted PDF text
// • Each parsed menu row
// • Final CSV string

// ================================
// ✅ CSV OUTPUT EXAMPLE
// ================================
// Item,Price
// сал.1 Салата Гръцка голяма 250гр,3,22
// супа 1 Супа топчета 300гр,2,97
// десерт 2 Мляко с ориз 180 гр,1,94
