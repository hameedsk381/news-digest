"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { LoginView } from "@/components/LoginView";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import "./globals.css";
import Home from "./page";

function AppContent() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case "dashboard": return t("header.dashboard");
      case "files": return t("header.files");
      case "history": return t("header.history");
      case "chat": return t("header.chat");
      case "analytics": return t("header.analytics");
      default: return t("header.logs");
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em]">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView onLogin={(data) => setUser(data)} />;
  }

  return (
    <>
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} user={user} logout={logout} />
      <main className={cn("ml-64 min-h-screen transition-all duration-300 bg-[#0f172a]")}>
        <Header title={getHeaderTitle()} />
        <div className="h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar p-8">
          <Home activeTab={activeTab} setActiveTab={handleTabChange} user={user} />
        </div>
      </main>
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased overflow-hidden">
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </body>
    </html>
  );
}
