"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import TTSTab from "@/components/tabs/TTSTab";
import CloneTab from "@/components/tabs/CloneTab";
import HistoryTab from "@/components/tabs/HistoryTab";
import AnalyticsTab from "@/components/tabs/AnalyticsTab";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loaderDone, setLoaderDone] = useState(false);
  const [activeTab, setActiveTab] = useState("tts");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading]);

  function handleTheme(t: string) {
    setTheme(t);
    document.body.className = t === "light" ? "light" : "";
  }

  if (loading) return null;

  return (
    <>
      {!loaderDone && <Loader onDone={() => setLoaderDone(true)} />}
      <div style={{
        display: "flex", height: "100vh", overflow: "hidden",
        opacity: loaderDone ? 1 : 0, transition: "opacity 0.8s"
      }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Topbar activeTab={activeTab} theme={theme} setTheme={handleTheme} />
          <div style={{
            flex: 1, overflowY: "auto", padding: 24, background: "var(--bg)"
          }}>
            {activeTab === "tts" && <TTSTab />}
            {activeTab === "clone" && <CloneTab />}
            {activeTab === "history" && <HistoryTab />}
            {activeTab === "analytics" && <AnalyticsTab />}
          </div>
        </div>
      </div>
    </>
  );
}
