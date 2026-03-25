"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import DashboardLayout from "@/components/DashboardLayout";
import TTSTab from "@/components/tabs/TTSTab";
import CloneTab from "@/components/tabs/CloneTab";
import HistoryTab from "@/components/tabs/HistoryTab";
import AnalyticsTab from "@/components/tabs/AnalyticsTab";
import { useSearchParams } from "next/navigation";

export default function Dashboard() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "tts";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab} showLoader={true}>
      {activeTab === "tts" && <TTSTab />}
      {activeTab === "clone" && <CloneTab />}
      {activeTab === "history" && <HistoryTab />}
      {activeTab === "analytics" && <AnalyticsTab />}
    </DashboardLayout>
  );
}
