"use client";

import React, { useState } from "react";
import {
    Building2,
    Lock,
    User,
    ChevronRight,
    Loader2,
    ShieldCheck,
    Globe,
    Newspaper
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { API_BASE_URL } from "@/lib/api";

export function LoginView({ onLogin }: { onLogin: (data: any) => void }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t, locale, setLocale } = useLanguage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData,
            });

            if (!res.ok) {
                throw new Error(t("login.invalidCredentials"));
            }

            const data = await res.json();
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data));
            onLogin(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0f172a] relative overflow-hidden">
            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-20">
                <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
                    <button
                        onClick={() => setLocale("en")}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            locale === "en"
                                ? "bg-indigo-600 text-white shadow-lg"
                                : "text-white/40 hover:text-white"
                        )}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLocale("te")}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            locale === "te"
                                ? "bg-indigo-600 text-white shadow-lg"
                                : "text-white/40 hover:text-white"
                        )}
                    >
                        తెలుగు
                    </button>
                </div>
            </div>

            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-amber-500" />

                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6">
                            <Newspaper className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase">{t("login.title")}</h1>
                        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black mt-1">{t("login.subtitle")}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{t("login.username")}</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-white/10"
                                    placeholder={t("login.usernamePlaceholder")}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{t("login.password")}</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-white/10"
                                    placeholder={t("login.passwordPlaceholder")}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-xs font-bold text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98] uppercase tracking-widest text-xs"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("login.submit")} <ChevronRight className="w-4 h-4" /></>}
                        </button>
                    </form>

                    <div className="mt-10 flex items-center justify-between text-[10px] text-white/20 font-black uppercase tracking-widest border-t border-white/5 pt-6">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-indigo-500" /> {t("login.secureEncryption")}
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe className="w-3 h-3 text-emerald-500" /> {t("login.authorizedOnly")}
                        </div>
                    </div>
                </div>

                <p className="text-center mt-8 text-[10px] text-white/20 font-black uppercase tracking-[0.3em] leading-relaxed">
                    {t("app.tagline")}
                </p>
            </motion.div>
        </div>
    );
}
