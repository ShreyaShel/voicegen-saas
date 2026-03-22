"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { loginUser } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(form);
      login(res.data.access_token, res.data.user);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, position: "relative", overflow: "hidden"
    }}>
      {/* Background orbs */}
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(124,111,255,0.15),transparent 70%)",
        top: -100, left: -100, pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute", width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(255,107,157,0.1),transparent 70%)",
        bottom: -50, right: -50, pointerEvents: "none"
      }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
            background: "linear-gradient(135deg,var(--p),var(--pink))",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M12 3C8 3 5 6 5 10c0 2.5 1.2 4.7 3 6.1V19h8v-2.9c1.8-1.4 3-3.6 3-6.1 0-4-3-7-7-7z"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, marginBottom: 6,
            background: "linear-gradient(135deg,var(--p2),var(--pink))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>VoiceGen</h1>
          <p style={{ fontSize: 14, color: "var(--text2)" }}>Welcome back — sign in to continue</p>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: 20, padding: 32
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Email
              </label>
              <input
                type="email" required
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{
                  width: "100%", padding: "12px 16px",
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  borderRadius: 12, color: "var(--text)", fontSize: 14, outline: "none"
                }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Password
              </label>
              <input
                type="password" required
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{
                  width: "100%", padding: "12px 16px",
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  borderRadius: 12, color: "var(--text)", fontSize: 14, outline: "none"
                }}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              width: "100%", padding: 16, borderRadius: 14, border: "none",
              background: loading ? "var(--bg3)" : "linear-gradient(135deg,var(--p),var(--pink))",
              color: loading ? "var(--text2)" : "white",
              fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: 0.5
            }}>
              {loading ? "⟳ Signing in..." : "✦ Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text2)" }}>
            No account?{" "}
            <Link href="/signup" style={{ color: "var(--p2)", fontWeight: 600, textDecoration: "none" }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}