"use client";
import { useState, useEffect } from "react";
import { getHistory } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const langFlags: Record<string, string> = {
  en: "🇬🇧", hi: "🇮🇳", fr: "🇫🇷", es: "🇪🇸",
  de: "🇩🇪", it: "🇮🇹", pt: "🇧🇷", ru: "🇷🇺",
  "zh-cn": "🇨🇳", ar: "🇸🇦", ko: "🇰🇷", nl: "🇳🇱",
  tr: "🇹🇷", pl: "🇵🇱"
};

export default function HistoryTab() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    getHistory().then(r => setHistory(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="accent-line" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { val: history.length, label: "Total generations" },
          { val: new Set(history.map((h: any) => h.voice_id).filter(Boolean)).size, label: "Voices used" },
          { val: "14", label: "Languages available" },
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
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {history.length === 0 ? (
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: 16, padding: 40, textAlign: "center"
        }}>
          <p style={{ fontSize: 14, color: "var(--text3)" }}>No generations yet. Generate some speech first!</p>
        </div>
      ) : (
        history.map((item: any) => (
          <div key={item.id} style={{
            display: "flex", alignItems: "center", gap: 14, padding: 14,
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 12, marginBottom: 8, cursor: "pointer"
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg,var(--p),var(--pink))",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
            }}>🎵</div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{
                fontSize: 13, fontWeight: 500, color: "var(--text)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
              }}>{item.text}</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
            <a href={`${API_URL}${item.download_url}`} target="_blank" rel="noreferrer" style={{
              padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)",
              background: "var(--bg3)", color: "var(--text2)", fontSize: 11,
              fontWeight: 600, textDecoration: "none", flexShrink: 0
            }}>▶ Play</a>
          </div>
        ))
      )}
    </div>
  );
}