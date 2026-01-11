"use client";


import { API_BASE_URL } from "@/lib/api";
import React, { useEffect, useRef, useState } from "react";
import {
    Terminal as TerminalIcon,
    Circle,
    Cpu,
    Zap,
    ShieldAlert,
    User,
    Fingerprint,
    Clock,
    Activity,
    Lock,
    Search,
    FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuditEntry {
    id: string;
    action: string;
    details: string;
    timestamp: string;
    ip_address: string;
    user: string;
}

export function LiveLogs({ logs: pipelineLogs, user }: { logs: string[], user: any }) {
    const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
    const [activeView, setActiveView] = useState<"audit" | "pipeline">("audit");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchAuditLogs = async () => {
        if (user.role !== 'ADMIN' && user.role !== 'ANALYST') return;
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch("${API_BASE_URL}/analytics/logs", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                setAuditLogs(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch audit logs", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeView === "audit") {
            fetchAuditLogs();
            const interval = setInterval(fetchAuditLogs, 5000);
            return () => clearInterval(interval);
        }
    }, [activeView]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [pipelineLogs, auditLogs]);

    const getActionIcon = (action: string) => {
        if (action.includes("LOGIN")) return <Lock className="w-3.5 h-3.5 text-amber-500" />;
        if (action.includes("SEARCH")) return <Search className="w-3.5 h-3.5 text-indigo-400" />;
        if (action.includes("BRIEFING")) return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
        return <Activity className="w-3.5 h-3.5 text-white/40" />;
    };

    return (
        <div className="flex flex-col h-full glass border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#0a0a0f]/80 backdrop-blur-3xl">
            {/* Header / Tabs */}
            <div className="bg-white/5 px-8 py-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <TerminalIcon className="w-5 h-5 text-indigo-400" />
                        <span className="font-black text-xs uppercase tracking-[0.2em] text-white">System Monitor</span>
                    </div>

                    <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                        <button
                            onClick={() => setActiveView("audit")}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                activeView === 'audit' ? "bg-indigo-600 text-white shadow-lg" : "text-white/30 hover:text-white"
                            )}
                        >
                            Audit Trail
                        </button>
                        <button
                            onClick={() => setActiveView("pipeline")}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                activeView === 'pipeline' ? "bg-indigo-600 text-white shadow-lg" : "text-white/30 hover:text-white"
                            )}
                        >
                            Neural Status
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex gap-1.5 mr-4 opacity-50">
                        <Circle className="w-2.5 h-2.5 fill-red-500 text-red-500" />
                        <Circle className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
                        <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500" />
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-400 tracking-tighter uppercase">Authorized Stream</span>
                    </div>
                </div>
            </div>

            {/* Log Body */}
            <div
                ref={scrollRef}
                className="flex-1 p-8 font-mono text-sm overflow-y-auto custom-scrollbar space-y-3 bg-black/20"
            >
                {activeView === 'audit' ? (
                    (user.role !== 'ADMIN' && user.role !== 'ANALYST') ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40">
                            <ShieldAlert className="w-12 h-12 mb-4 text-amber-500" />
                            <p className="text-xs font-black uppercase tracking-widest">Administrative Privileges Required</p>
                        </div>
                    ) : (
                        auditLogs.map((log) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={log.id}
                                className="group grid grid-cols-[140px_1fr] md:grid-cols-[180px_120px_100px_1fr] gap-4 items-center py-3 px-4 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
                            >
                                <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                                        {getActionIcon(log.action)}
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider font-mono">{log.action}</span>
                                </div>
                                <div className="hidden md:flex items-center gap-2 opacity-40">
                                    <User className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold">{log.user}</span>
                                </div>
                                <div className="text-[10px] font-medium text-white/60 truncate">
                                    {log.details}
                                </div>
                            </motion.div>
                        ))
                    )
                ) : (
                    pipelineLogs.map((log, i) => (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={i}
                            className="flex gap-4 border-l-2 border-transparent hover:border-indigo-500/50 hover:bg-white/5 px-2 transition-all group"
                        >
                            <span className="text-white/10 select-none w-10 text-right group-hover:text-indigo-500/50 transition-colors">{i + 1}</span>
                            <span className={cn(
                                "break-all text-[12px] font-mono",
                                log.includes("Error") || log.includes("FAILED") ? "text-red-400" :
                                    log.includes("SUCCESS") || log.includes("complete") ? "text-emerald-400" :
                                        log.includes("---NODE:") ? "text-indigo-400 font-black tracking-widest uppercase text-[10px]" : "text-white/60"
                            )}>
                                {log}
                            </span>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="bg-white/5 px-8 py-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Fingerprint className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Session ID: {user.username}-{Math.random().toString(36).substring(7)}</span>
                    </div>
                </div>
                <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                    Departmental Audit Protocol v2.0
                </div>
            </div>
        </div>
    );
}
