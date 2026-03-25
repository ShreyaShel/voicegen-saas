"use client";

const titles: Record<string, string> = {
  avatar: "Avatar Generator",
  tts: "Text to Speech",
  clone: "Voice Cloning",
  history: "History",
  analytics: "Analytics",
};

export default function Topbar({
  activeTab, theme, setTheme
}: {
  activeTab: string;
  theme: string;
  setTheme: (t: string) => void;
}) {
  return (
    <div style={{
      height: 60, background: "var(--bg2)", borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", flexShrink: 0
    }}>
      <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>
        {titles[activeTab]}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          display: "flex", background: "var(--bg3)",
          border: "1px solid var(--border)", borderRadius: 20, padding: 3, gap: 2
        }}>
          {["dark", "light"].map(t => (
            <button key={t} onClick={() => setTheme(t)} style={{
              padding: "4px 10px", borderRadius: 16, border: "none",
              background: theme === t ? "var(--p)" : "transparent",
              color: theme === t ? "white" : "var(--text2)",
              cursor: "pointer", fontSize: 11, fontWeight: 600, letterSpacing: 0.5
            }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}