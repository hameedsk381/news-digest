"use client";

import React, { useEffect, useState } from "react";
import {
    History,
    FileText,
    Calendar,
    Layers,
    Search,
    ChevronRight,
    Filter,
    Download,
    AlertCircle,
    X,
    FileBox,
    ChevronDown,
    ChevronUp,
    FileCheck2,
    Zap,
    Loader2,
    Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ArticlesHistoryView({ user }: { user: any }) {
    const [activeSubTab, setActiveSubTab] = useState<"articles" | "files">("articles");
    const [articles, setArticles] = useState<any[]>([]);
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDept, setSelectedDept] = useState("All");
    const [selectedSentiment, setSelectedSentiment] = useState("All");
    const [expandedDocs, setExpandedDocs] = useState<string[]>([]);

    // Briefing States
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
    const [briefing, setBriefing] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const articlesRes = await fetch("http://localhost:8000/api/v1/pipeline/all-articles", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const filesRes = await fetch("http://localhost:8000/api/v1/pipeline/history", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (articlesRes.ok) setArticles(await articlesRes.json());
            if (filesRes.ok) setFiles(await filesRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    const departments = ["All", ...Array.from(new Set(articles.map(a => a.department).filter(Boolean)))];
    const sentiments = ["All", "Positive", "Negative", "Neutral"];

    const filteredArticles = articles.filter(a => {
        const matchesSearch = a.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.body.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = selectedDept === "All" || a.department === selectedDept;
        const matchesSentiment = selectedSentiment === "All" || a.sentiment_label === selectedSentiment;

        return matchesSearch && matchesDept && matchesSentiment;
    });

    // Group filtered articles by filename
    const groupedArticles = filteredArticles.reduce((acc: any, article) => {
        const docName = article.filename || "Unknown Source";
        if (!acc[docName]) acc[docName] = [];
        acc[docName].push(article);
        return acc;
    }, {});

    const toggleDocExpand = (docName: string) => {
        setExpandedDocs(prev =>
            prev.includes(docName) ? prev.filter(d => d !== docName) : [...prev, docName]
        );
    };

    const toggleFileSelection = (fileId: string) => {
        setSelectedFiles(prev =>
            prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
        );
    };

    const generateBriefing = async () => {
        if (selectedFiles.length === 0) return;
        setIsGeneratingBriefing(true);
        setBriefing(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8000/api/v1/pipeline/generate-briefing", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ file_ids: selectedFiles })
            });
            if (res.ok) {
                const data = await res.json();
                setBriefing(data.briefing);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingBriefing(false);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20 relative">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5 w-fit">
                        <button
                            onClick={() => setActiveSubTab("articles")}
                            className={cn(
                                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                                activeSubTab === "articles" ? "bg-indigo-600 text-white shadow-lg" : "text-white/40 hover:text-white"
                            )}
                        >
                            Intelligence Base
                        </button>
                        <button
                            onClick={() => setActiveSubTab("files")}
                            className={cn(
                                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                                activeSubTab === "files" ? "bg-indigo-600 text-white shadow-lg" : "text-white/40 hover:text-white"
                            )}
                        >
                            Source Documents
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        {selectedFiles.length > 0 && activeSubTab === "files" && (user.role === 'ADMIN' || user.role === 'ANALYST') && (
                            <button
                                onClick={generateBriefing}
                                disabled={isGeneratingBriefing}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                            >
                                {isGeneratingBriefing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                Generate Executive Briefing
                            </button>
                        )}

                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search archive..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-2.5 text-sm w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white placeholder:text-white/20"
                            />
                        </div>
                    </div>
                </div>

                {activeSubTab === "articles" && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap items-center gap-4"
                    >
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-white/40" />
                            <span className="text-xs font-bold uppercase tracking-wider text-white/30">Filters</span>
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white/70 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer appearance-none"
                            >
                                {departments.map((dept: any) => (
                                    <option key={dept} value={dept} className="bg-[#0f172a]">{dept === "All" ? "Departments: All" : dept}</option>
                                ))}
                            </select>

                            <select
                                value={selectedSentiment}
                                onChange={(e) => setSelectedSentiment(e.target.value)}
                                className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white/70 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer appearance-none"
                            >
                                {sentiments.map(sentiment => (
                                    <option key={sentiment} value={sentiment} className="bg-[#0f172a]">{sentiment === "All" ? "Sentiment: All" : sentiment}</option>
                                ))}
                            </select>

                            {(selectedDept !== "All" || selectedSentiment !== "All" || searchTerm) && (
                                <button
                                    onClick={() => { setSelectedDept("All"); setSelectedSentiment("All"); setSearchTerm(""); }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500/10 text-pink-400 text-xs font-bold border border-pink-500/20 hover:bg-pink-500/20 transition-all"
                                >
                                    <X className="w-3 h-3" /> Clear Filters
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Briefing Modal */}
            <AnimatePresence>
                {briefing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#0f172a] border border-white/10 rounded-[3rem] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Neural Executive Briefing</h3>
                                        <p className="text-xs text-white/40 uppercase font-black tracking-widest">Formal Strategic Analysis</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setBriefing(null)}
                                    className="p-3 rounded-2xl hover:bg-white/5 text-white/30 hover:text-white transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white/[0.01]">
                                <div className="prose prose-invert prose-amber max-w-none">
                                    <div className="whitespace-pre-wrap text-white/80 leading-relaxed font-medium">
                                        {briefing}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[10px] text-white/20 font-bold uppercase tracking-widest">
                                    <Check className="w-3 h-3 text-emerald-500" /> Grounded in {selectedFiles.length} Documents
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => window.print()}
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/5"
                                    >
                                        Print
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const token = localStorage.getItem("token");
                                            const res = await fetch("http://localhost:8000/api/v1/pipeline/download-briefing-pdf", {
                                                method: "POST",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                    "Authorization": `Bearer ${token}`
                                                },
                                                body: JSON.stringify({ markdown_content: briefing })
                                            });
                                            if (res.ok) {
                                                const blob = await res.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `GOV_BRIEFING_${new Date().getTime()}.pdf`;
                                                a.click();
                                            }
                                        }}
                                        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-indigo-500/10 active:scale-95"
                                    >
                                        Download Formal PDF
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-64 flex items-center justify-center"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <History className="w-10 h-10 text-indigo-500 animate-spin" />
                            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Querying Neural Archive...</p>
                        </div>
                    </motion.div>
                ) : activeSubTab === "articles" ? (
                    <motion.div
                        key="articles"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {Object.keys(groupedArticles).length === 0 ? (
                            <div className="glass border border-white/5 p-20 rounded-[3rem] text-center">
                                <AlertCircle className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                <p className="text-white/40 font-medium">No records found in the intelligence base.</p>
                            </div>
                        ) : (
                            Object.entries(groupedArticles).map(([docName, docArticles]: [string, any], groupIdx) => (
                                <div key={docName} className="space-y-4">
                                    <div className="relative">
                                        {/* Floating select indicator in articles view? No, only in files view for now. */}
                                        <button
                                            onClick={() => toggleDocExpand(docName)}
                                            className="w-full flex items-center justify-between p-6 glass border border-white/10 rounded-[2rem] hover:bg-white/5 transition-all group"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                                    <FileBox className="w-6 h-6" />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <h3 className="text-lg font-bold text-white truncate">{docName}</h3>
                                                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{docArticles.length} Intelligence Units Found</p>
                                                </div>
                                            </div>
                                            {expandedDocs.includes(docName) ? <ChevronUp className="w-6 h-6 text-white/30" /> : <ChevronDown className="w-6 h-6 text-white/30" />}
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {(!expandedDocs.length || expandedDocs.includes(docName)) && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="grid grid-cols-1 gap-4 overflow-hidden"
                                            >
                                                {docArticles.map((article: any, idx: number) => (
                                                    <div
                                                        key={article.id || idx}
                                                        className="ml-6 glass border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.03] transition-colors relative group overflow-hidden"
                                                    >
                                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                            <FileText className="w-32 h-32 -rotate-12 translate-x-12 -translate-y-12" />
                                                        </div>

                                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                                                            <div className="space-y-2 flex-1 relative z-10">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                                                        {article.department || "General"}
                                                                    </span>
                                                                </div>
                                                                <h3 className="text-xl font-bold text-white leading-snug group-hover:text-indigo-300 transition-colors">{article.headline}</h3>
                                                            </div>

                                                            <div className={cn(
                                                                "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border self-start relative z-10",
                                                                article.sentiment_label === 'Positive' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                                    article.sentiment_label === 'Negative' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                                        "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                                            )}>
                                                                {article.sentiment_label || "Neutral"}
                                                            </div>
                                                        </div>

                                                        <p className="text-white/60 leading-relaxed text-sm line-clamp-3 mb-6 relative z-10">
                                                            {article.body}
                                                        </p>

                                                        <div className="flex items-center justify-between pt-6 border-t border-white/5 relative z-10 uppercase tracking-widest font-bold text-[10px] text-white/20">
                                                            <div className="flex items-center gap-6">
                                                                <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> Topic: {article.topic_cluster_id?.split('_')[1] || "None"}</span>
                                                                <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Conf: {(article.confidence * 100).toFixed(0)}%</span>
                                                            </div>
                                                            <span>Article ID: #{article.id}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="files"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {files.map((file, idx) => (
                            <div
                                key={file.id || idx}
                                onClick={() => toggleFileSelection(file.id)}
                                className={cn(
                                    "glass border p-6 rounded-3xl transition-all group relative cursor-pointer",
                                    selectedFiles.includes(file.id) ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20" : "border-white/5 hover:border-indigo-500/30"
                                )}
                            >
                                <div className="absolute top-4 right-4">
                                    {selectedFiles.includes(file.id) ? (
                                        <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full border border-white/10 group-hover:border-indigo-500/40" />
                                    )}
                                </div>

                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                                    selectedFiles.includes(file.id) ? "bg-amber-500/20 text-amber-500" : "bg-indigo-500/10 text-indigo-400"
                                )}>
                                    <FileCheck2 className="w-6 h-6" />
                                </div>
                                <h4 className="font-bold text-lg mb-2 truncate text-white">{file.filename}</h4>
                                <div className="flex flex-col gap-2 mb-6">
                                    <div className="flex items-center gap-2 text-xs text-white/40">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(file.upload_date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-white/40">
                                        <Layers className="w-3.5 h-3.5" />
                                        {file.article_count} Articles Extracted
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 relative z-10">
                                    <a
                                        href={`http://localhost:8000/api/v1/export/${file.id}/excel`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] uppercase tracking-widest font-bold transition-all border border-white/5 text-white/70"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Data Export
                                    </a>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
