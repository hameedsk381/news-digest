"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
    const { locale, setLocale } = useLanguage();

    return (
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
            <button
                onClick={() => setLocale("en")}
                className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
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
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                    locale === "te"
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-white/40 hover:text-white"
                )}
            >
                తెలుగు
            </button>
        </div>
    );
}
