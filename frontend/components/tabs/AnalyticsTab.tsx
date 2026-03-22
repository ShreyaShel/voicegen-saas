"use client";
import { useState, useEffect } from "react";
import { getHistory } from "@/lib/api";

export default function AnalyticsTab() {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    getHistory().then(r => setTotal(r.data.length)).catch(() => {});
  }, []);

  const langs = [
    { name: "English", pct: 72, color: "var(--p)" },
    { name: "Hindi", pct: 15, color: "var(--pink)" },
    { name: "French", pct: 8, color: "var(--cyan)" },
    { name: "Spanish", pct: 5, color: "var(--green)" },
  ];

  const voices = [
    { name: "Emma (Female, Clear)", pct: 45 },
    { name: "Tom (Male, Deep)", pct: 28 },
    { name: "Sarah (Female, Warm)", pct: 18 },
    { name: "James (Male, Clear)", pct: 9 },
  ];

  return (
    <div>
      <div className="accent-line" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { val: total, label: "Total generations" },
          { val: 14, label: "Languages available" },
          { val: "98%", label: "Success rate" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 16, padding: 16, position: "relative", overflow: "hidden"
          }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,var(--p),var(--pink))" }} />
            <div style={{
              fontSize: 28, fontWeight: 800,
              background: "linear-gradient(135deg,var(--p2),var(--pink))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>{s.val}</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {[
        { title: "Language usage", data: langs },
        { title: "Voice usage", data: voices.map(v => ({ ...v, color: "var(--p)" })) },
      ].map((section, si) => (
        <div key={si} style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: 16, padding: 20, marginBottom: 16
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 16 }}>
            {section.title}
          </p>
          {section.data.map((item: any, i: number) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{item.name}</span>
                <span style={{ fontSize: 12, color: "var(--text2)" }}>{item.pct}%</span>
              </div>
              <div style={{ height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  background: `linear-gradient(90deg,${item.color || "var(--p)"},var(--pink))`,
                  width: `${item.pct}%`, transition: "width 1s ease"
                }} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}