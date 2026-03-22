"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push("/dashboard");
  }, [user, loading]);

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 24, position: "relative", overflow: "hidden"
    }}>
      {/* Orbs */}
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(124,111,255,0.12),transparent 70%)",
        top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute", width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(255,107,157,0.08),transparent 70%)",
        top: 0, right: 0, pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute", width: 200, height: 200, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(0,212,255,0.08),transparent 70%)",
        bottom: 0, left: 0, pointerEvents: "none"
      }} />

      <div style={{ textAlign: "center", maxWidth: 600, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: "0 auto 24px",
          background: "linear-gradient(135deg,var(--p),var(--pink))",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
            <path d="M12 3C8 3 5 6 5 10c0 2.5 1.2 4.7 3 6.1V19h8v-2.9c1.8-1.4 3-3.6 3-6.1 0-4-3-7-7-7z"/>
          </svg>
        </div>

        <h1 style={{
          fontSize: 52, fontWeight: 900, marginBottom: 16, lineHeight: 1.1,
          background: "linear-gradient(135deg,var(--p2),var(--pink),var(--cyan))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>VoiceGen AI</h1>

        <p style={{ fontSize: 18, color: "var(--text2)", marginBottom: 12, lineHeight: 1.6 }}>
          Text-to-speech and voice cloning in 14 languages.
        </p>
        <p style={{ fontSize: 14, color: "var(--text3)", marginBottom: 40 }}>
          Smart spell-check · Auto-translation · Multi-voice · GPU-powered
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup" style={{
            padding: "16px 32px", borderRadius: 14,
            background: "linear-gradient(135deg,var(--p),var(--pink))",
            color: "white", fontSize: 15, fontWeight: 700,
            textDecoration: "none", letterSpacing: 0.5
          }}>
            ✦ Get Started Free
          </Link>
          <Link href="/login" style={{
            padding: "16px 32px", borderRadius: 14,
            background: "var(--bg2)", border: "1px solid var(--border)",
            color: "var(--text)", fontSize: 15, fontWeight: 600,
            textDecoration: "none"
          }}>
            Sign In
          </Link>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 48 }}>
          {["14 Languages", "Voice Cloning", "Smart Grammar Fix", "8 English Voices", "GPU Accelerated", "Dark & Light Mode"].map(f => (
            <span key={f} style={{
              padding: "6px 14px", borderRadius: 20,
              background: "var(--bg2)", border: "1px solid var(--border)",
              color: "var(--text2)", fontSize: 12, fontWeight: 500
            }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}