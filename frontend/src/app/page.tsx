"use client";

import React, { useState, useEffect } from "react";
import { SummaryDashboard } from "@/components/SummaryDashboard";
import { FileUploadView } from "@/components/FileUploadView";
import { AnalyticsView } from "@/components/AnalyticsView";
import { LiveLogs } from "@/components/LiveLogs";
import { ChatView } from "@/components/ChatView";
import { ArticlesHistoryView } from "@/components/ArticlesHistoryView";
import { motion, AnimatePresence } from "framer-motion";

export default function Home({
  activeTab,
  setActiveTab,
  user
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
}) {
  const [logs, setLogs] = useState<string[]>([
    "System initialized.",
    "Neural weights loaded successfully.",
    "Ready for news ingestion."
  ]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleProcessingComplete = () => {
    // Navigate to history after short delay
    setTimeout(() => {
      setActiveTab("history");
    }, 2000);
  };

  const handleProcessingStart = (log: string) => {
    addLog(log);
    // Navigate to logs when processing starts (only on the first log from FileUploadView)
    if (activeTab === "files" && log.includes("INIT:")) {
      setActiveTab("logs");
    }
  };

  // Switch view based on activeTab
  const renderView = () => {
    switch (activeTab) {
      case "dashboard":
        return <SummaryDashboard />;
      case "files":
        return <FileUploadView
          onProcessingStart={handleProcessingStart}
          onProcessingComplete={handleProcessingComplete}
        />;
      case "history":
        return <ArticlesHistoryView user={user} />;
      case "chat":
        return <ChatView />;
      case "analytics":
        return <AnalyticsView />;
      case "logs":
        return <LiveLogs logs={logs} user={user} />;
      default:
        return <SummaryDashboard />;
    }
  };

  return (
    <div className="h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-full"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
