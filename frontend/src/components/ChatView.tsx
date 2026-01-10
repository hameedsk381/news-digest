"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Send,
    Bot,
    User,
    Loader2,
    Sparkles,
    Link as LinkIcon,
    Search,
    Globe,
    Database,
    ArrowRight,
    Info,
    ChevronDown,
    ChevronUp,
    Mic,
    MicOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Source {
    headline: string;
    snippet: string;
}

interface Message {
    role: "user" | "assistant";
    content: string;
    sources?: Source[];
    type?: "web" | "knowledge";
}

// Add type for SpeechRecognition
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export function ChatView() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [useWeb, setUseWeb] = useState(false);
    const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
    const [isListening, setIsListening] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hello! I am your Digital Research Assistant. You can ask me anything about items in our Knowledge Bank, or toggle 'Live Web Search' to find information from the internet. You can also use the microphone icon to speak your query."
        }
    ]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    useEffect(() => {
        // Initialize Web Speech API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = "en-IN"; // Default to English (India) - supports multilingual context better

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setQuery(transcript);
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                console.error("Speech Recognition Error:", event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setQuery("");
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const toggleSource = (msgIdx: number, srcIdx: number) => {
        const key = `${msgIdx}-${srcIdx}`;
        setExpandedSources(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim() || loading) return;

        const userMsg = query;
        const isWebSearch = useWeb;
        setQuery("");
        setMessages(prev => [...prev, { role: "user", content: userMsg, type: isWebSearch ? "web" : "knowledge" }]);
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8000/api/v1/search/query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: userMsg,
                    use_web: isWebSearch
                }),
            });

            if (!res.ok) throw new Error("Search failed");
            const data = await res.json();

            setMessages(prev => [...prev, {
                role: "assistant",
                content: data.answer,
                sources: data.sources,
                type: isWebSearch ? "web" : "knowledge"
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Sorry, I encountered an error while searching the system."
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col">
            {/* Search Mode Toggle */}
            <div className="flex justify-center mb-6">
                <div className="p-1 bg-white/5 border border-white/5 rounded-2xl flex gap-1">
                    <button
                        onClick={() => setUseWeb(false)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all",
                            !useWeb ? "bg-indigo-600 text-white shadow-lg" : "text-white/40 hover:text-white"
                        )}
                    >
                        <Database className="w-3.5 h-3.5" />
                        Knowledge Bank
                    </button>
                    <button
                        onClick={() => setUseWeb(true)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all",
                            useWeb ? "bg-indigo-600 text-white shadow-lg" : "text-white/40 hover:text-white"
                        )}
                    >
                        <Globe className="w-3.5 h-3.5" />
                        Live Web Search
                    </button>
                </div>
            </div>

            {/* Chat Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-10 pr-4"
            >
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "flex gap-4 p-6 rounded-3xl border",
                                msg.role === "assistant"
                                    ? "glass border-white/5 bg-white/[0.02]"
                                    : "bg-indigo-600/10 border-indigo-500/20 ml-12"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                msg.role === "assistant" ? "bg-indigo-500/20 text-indigo-400" : "bg-white/10 text-white/70"
                            )}>
                                {msg.role === "assistant" ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
                            </div>

                            <div className="space-y-4 flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-bold uppercase tracking-widest text-white/30">
                                        {msg.role === "assistant" ? "Digital Assistant" : "User Request"}
                                    </div>
                                    {msg.type && (
                                        <div className={cn(
                                            "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border",
                                            msg.type === 'web' ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" : "text-indigo-400 border-indigo-400/20 bg-indigo-400/5"
                                        )}>
                                            {msg.type === 'web' ? "Live Web" : "Local Archive"}
                                        </div>
                                    )}
                                </div>
                                <div className="text-white/80 leading-relaxed whitespace-pre-wrap text-sm antialiased">
                                    {msg.content}
                                </div>

                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="pt-4 border-t border-white/5 space-y-3">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 flex items-center gap-1.5">
                                            <LinkIcon className="w-3 h-3" /> Supporting Evidence
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {msg.sources.map((source, idx) => (
                                                <div key={idx} className="group flex flex-col bg-white/5 border border-white/5 rounded-xl overflow-hidden hover:border-indigo-500/30 transition-all">
                                                    <button
                                                        onClick={() => toggleSource(i, idx)}
                                                        className="flex items-center justify-between px-4 py-3 text-left w-full"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="w-4 h-4 rounded-full bg-indigo-500/10 flex items-center justify-center text-[8px] text-indigo-400 border border-indigo-500/20">{idx + 1}</span>
                                                            <span className="text-[11px] text-white/70 font-bold truncate">{source.headline}</span>
                                                        </div>
                                                        {expandedSources[`${i}-${idx}`] ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />}
                                                    </button>

                                                    <AnimatePresence>
                                                        {expandedSources[`${i}-${idx}`] && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="px-4 pb-4 overflow-hidden"
                                                            >
                                                                <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                                                                    <p className="text-[10px] text-white/50 leading-relaxed italic line-clamp-4">
                                                                        "{source.snippet}"
                                                                    </p>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-4 p-6 rounded-3xl glass border border-white/5 bg-white/[0.02]"
                        >
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                            <div className="space-y-4">
                                <div className="text-sm font-bold uppercase tracking-widest text-white/30">
                                    {useWeb ? "Scanning Global Networks..." : "Analyzing Data Bank..."}
                                </div>
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="mt-6 glass border border-white/10 p-2 rounded-[2rem] shadow-2xl relative">
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                        {useWeb ? <Globe className="w-6 h-6 text-emerald-400" /> : <Search className="w-6 h-6 text-indigo-400" />}
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={isListening ? "Listening..." : useWeb ? "Search the live web..." : "Ask a government data question..."}
                        className={cn(
                            "flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-white px-2 placeholder:text-white/20 font-medium",
                            isListening && "text-indigo-400 animate-pulse"
                        )}
                    />
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                            isListening ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/5 text-white/30 hover:text-white"
                        )}
                    >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                            !query.trim() || loading
                                ? "bg-white/5 text-white/20"
                                : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-95"
                        )}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-500 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
                    <Sparkles className="w-3 h-3" /> {isListening ? "Voice Active" : useWeb ? "Firecrawl Hybrid Search" : "Neural Archive Mode"}
                </div>
            </div>
        </div>
    );
}
