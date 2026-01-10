"use client";

import React from "react";
import {
    LayoutDashboard,
    FileOutput,
    Database,
    LineChart,
    Terminal,
    Newspaper,
    Search,
    LogOut,
    ShieldCheck,
    Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export function Sidebar({
    activeTab,
    setActiveTab,
    user,
    logout
}: {
    activeTab: string,
    setActiveTab: (id: string) => void,
    user: any,
    logout: () => void
}) {
    const { t } = useLanguage();

    const menuItems = [
        { icon: LayoutDashboard, label: t("sidebar.dashboard"), id: "dashboard" },
        { icon: FileOutput, label: t("sidebar.uploadFiles"), id: "files" },
        { icon: Database, label: t("sidebar.knowledgeBank"), id: "history" },
        { icon: Search, label: t("sidebar.assistant"), id: "chat" },
        { icon: LineChart, label: t("sidebar.analytics"), id: "analytics" },
        { icon: Terminal, label: t("sidebar.systemLogs"), id: "logs" },
    ];

    return (
        <aside className="w-64 h-full glass border-r border-white/10 flex flex-col p-6 fixed left-0 top-0 z-50">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Newspaper className="text-white w-6 h-6" />
                </div>
                <div>
                    <h1 className="font-bold text-lg leading-tight uppercase tracking-tighter">{t("app.title")}</h1>
                    <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">{t("app.subtitle")}</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1.5">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                            activeTab === item.id
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <item.icon className={cn(
                            "w-5 h-5 transition-transform duration-300",
                            activeTab === item.id ? "text-white" : "text-white/40"
                        )} />
                        <span className="font-semibold text-sm">{item.label}</span>
                        {activeTab === item.id && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                        )}
                    </button>
                ))}
            </nav>

            {/* Profile Section */}
            <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                <div className="px-4 py-3 bg-white/5 rounded-2xl flex items-center gap-3 border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-black text-xs border border-amber-500/20">
                        {user.role === 'ADMIN' ? 'AD' : 'AN'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-white truncate">{user.full_name}</p>
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3 h-3 text-indigo-400" />
                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{user.role}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition-all text-xs font-bold uppercase tracking-widest"
                >
                    <LogOut className="w-4 h-4" /> {t("sidebar.logout")}
                </button>

                <div className="px-4">
                    <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mb-2 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Operational
                    </p>
                </div>
            </div>
        </aside>
    );
}
