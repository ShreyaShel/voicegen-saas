"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Loader from "./Loader";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab?: (tab: string) => void;
  showLoader?: boolean;
}

export default function DashboardLayout({
  children,
  activeTab,
  setActiveTab = () => {},
  showLoader = false
}: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Only show loader if requested AND we haven't shown it this session
  const [shouldShowLoader, setShouldShowLoader] = useState(false);
  const [loaderDone, setLoaderDone] = useState(!showLoader);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    if (showLoader) {
      const hasShown = sessionStorage.getItem("hasShownLoader");
      if (!hasShown) {
        setShouldShowLoader(true);
        setLoaderDone(false);
      } else {
        setShouldShowLoader(false);
        setLoaderDone(true);
      }
    }
  }, [showLoader]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading]);

  function handleLoaderDone() {
    setLoaderDone(true);
    sessionStorage.setItem("hasShownLoader", "true");
  }

  function handleTheme(t: string) {
    setTheme(t);
    document.body.className = t === "light" ? "light" : "";
  }

  if (loading) return null;

  return (
    <>
      {shouldShowLoader && !loaderDone && <Loader onDone={handleLoaderDone} />}
      <div style={{
        display: "flex", height: "100vh", overflow: "auto",
        opacity: (!showLoader || loaderDone) ? 1 : 0, transition: "opacity 0.8s"
      }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Topbar activeTab={activeTab} theme={theme} setTheme={handleTheme} />
          <div style={{
            flex: 1, overflowY: "auto", padding: 24, background: "var(--bg)"
          }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
