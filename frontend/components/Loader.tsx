"use client";
import { useEffect, useState } from "react";

export default function Loader({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", zIndex: 100
    }}>
      <div style={{ position: "relative", width: 80, height: 80, marginBottom: 24 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "3px solid transparent",
          borderTopColor: "var(--p)", borderRightColor: "var(--pink)",
          animation: "spin 1s linear infinite"
        }} />
        <div style={{
          position: "absolute", inset: 8, borderRadius: "50%",
          border: "2px solid transparent",
          borderBottomColor: "var(--cyan)",
          animation: "spin 0.7s linear infinite reverse"
        }} />
      </div>
      <p style={{
        fontSize: 13, color: "var(--text2)", letterSpacing: 2,
        textTransform: "uppercase", animation: "pulse 1.5s ease-in-out infinite"
      }}>
        Initializing VoiceGen AI
      </p>
      <div style={{ display: "flex", gap: 4, marginTop: 20 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="loader-bar" style={{
            width: 4, background: "var(--p)", borderRadius: 2,
            animationDelay: `${i * 0.08}s`
          }} />
        ))}
      </div>
    </div>
  );
}