"use client";

import React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    isPositive?: boolean;
    color?: "indigo" | "pink" | "violet" | "green";
}

const colorMap = {
    indigo: "from-indigo-500/20 to-indigo-600/10 text-indigo-400 border-indigo-500/20 shadow-indigo-500/5",
    pink: "from-pink-500/20 to-pink-600/10 text-pink-400 border-pink-500/20 shadow-pink-500/5",
    violet: "from-violet-500/20 to-violet-600/10 text-violet-400 border-violet-500/20 shadow-violet-500/5",
    green: "from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5",
};

export function StatCard({ label, value, icon: Icon, trend, isPositive, color = "indigo" }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "p-6 rounded-3xl glass border bg-gradient-to-br flex flex-col gap-4 shadow-xl transition-transform hover:scale-[1.02]",
                colorMap[color]
            )}
        >
            <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <span className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full border",
                        isPositive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-white/50 text-sm font-medium">{label}</p>
                <h3 className="text-3xl font-bold tracking-tight mt-1 text-white">{value}</h3>
            </div>
        </motion.div>
    );
}
