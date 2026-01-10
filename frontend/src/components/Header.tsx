"use client";

import React from "react";
import { User, Bell, Search } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Header({ title }: { title: string }) {
    return (
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 sticky top-0 bg-[#0f172a]/80 backdrop-blur-xl z-40">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
                <p className="text-sm text-white/50">Manage and analyze your news intelligence.</p>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search news..."
                        className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                </div>

                <LanguageSwitcher />

                <button className="p-2.5 rounded-full hover:bg-white/5 relative group transition-colors">
                    <Bell className="w-5 h-5 text-white/60 group-hover:text-white" />
                    <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-pink-500 rounded-full border-2 border-[#0f172a]" />
                </button>

                <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                    <div className="text-right flex flex-col items-end">
                        <span className="text-sm font-semibold text-white">Admin User</span>
                        <span className="text-[10px] text-green-500 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Connected
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                        <User className="text-indigo-400 w-5 h-5" />
                    </div>
                </div>
            </div>
        </header>
    );
}
