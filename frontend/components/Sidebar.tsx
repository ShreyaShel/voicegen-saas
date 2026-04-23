"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";

const tabs = [
  { id: "avatar", label: "Avatar Video", icon: (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
  </svg>
  )},
  { id: "conversation", label: "Conversation", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 15c0 1.1-.9 2-2 2H7l-4 4V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v10zM12 9c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM8 9c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm8 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
    </svg>
  )},
  { id: "tts", label: "Text to Speech", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
    </svg>
  )},
  { id: "clone", label: "Voice Cloning", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
    </svg>
  )},
  { id: "history", label: "History", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
    </svg>
  )},
  { id: "analytics", label: "Analytics", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
    </svg>
  )},
];

export default function Sidebar({
  activeTab, setActiveTab
}: {
  activeTab: string;
  setActiveTab: (t: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "VG";

  return (
    <div style={{
      width: collapsed ? 56 : 220,
      background: "var(--bg2)", borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
      overflow: "hidden", flexShrink: 0
    }}>
      {/* Header */}
      <div style={{
        padding: 16, display: "flex", alignItems: "center",
        justifyContent: "space-between", borderBottom: "1px solid var(--border)",
        minHeight: 60
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden", whiteSpace: "nowrap" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden"
          }} className="logo-icon">
             <img src="/logo.png" alt="EchoAI" style={{ width: "90%", height: "90%", objectFit: "contain" }} />
          </div>
          {!collapsed && (
            <span style={{
              fontSize: 16, fontWeight: 700,
              background: "linear-gradient(90deg,var(--p2),var(--cyan))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>EchoAI</span>
          )}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} style={{
          width: 24, height: 24, borderRadius: 6,
          background: "var(--bg3)", border: "1px solid var(--border)",
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0, color: "var(--text2)", fontSize: 12
        }}>
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* Nav */}
      <div style={{ padding: "12px 8px", flex: 1 }}>
        {tabs.map(tab => (
          <div key={tab.id} onClick={() => {
            if (tab.id === "avatar" || tab.id === "conversation") {
              router.push(`/${tab.id}`);
            } else if (pathname === "/dashboard") {
              setActiveTab(tab.id);
            } else {
              router.push(`/dashboard?tab=${tab.id}`);
            }
          }} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 10px", borderRadius: 12, cursor: "pointer",
            marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden",
            position: "relative", color: activeTab === tab.id ? "white" : "var(--text2)",
            background: activeTab === tab.id
              ? "linear-gradient(135deg,var(--p),var(--pink))"
              : "transparent",
            fontSize: 13, fontWeight: 500,
          }}>
            <span style={{ flexShrink: 0 }}>{tab.icon}</span>
            {!collapsed && <span>{tab.label}</span>}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: 10,
          borderRadius: 12, background: "var(--bg3)", border: "1px solid var(--border)",
          overflow: "hidden", whiteSpace: "nowrap", cursor: "pointer"
        }} onClick={() => { logout(); router.push("/"); }}>
          <div className="avatar" style={{
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg,var(--p),var(--pink))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "white"
          }}>{initials}</div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                {user?.full_name || "User"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>Sign out</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}