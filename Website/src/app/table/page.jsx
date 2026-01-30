"use client";

import { useState } from "react";

export default function Page() {
  const [lines, setLines] = useState([]);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ✅ Use legacy build (works in browser)
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");

    // ✅ Worker from unpkg
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let allText = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => item.str);
      allText.push(...strings);
    }

    setLines(allText);
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Upload menu</h2>
      <input type="file" accept="application/pdf" onChange={handleFile} />
      <table style={{ marginTop: 20, borderCollapse: "collapse" }}>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i}>
              <td style={{ border: "1px solid #ccc", padding: 6 }}>{line}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
