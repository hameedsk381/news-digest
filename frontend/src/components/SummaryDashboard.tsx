"use client";

import React, { useEffect, useState } from "react";
import { StatCard } from "./StatCard";
import {
    FileText,
    Newspaper,
    TrendingUp,
    Users,
    PieChart as PieChartIcon,
    Activity
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { motion } from "framer-motion";

export function SummaryDashboard() {
    const [data, setData] = useState<any>(null);

    const fetchData = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/v1/analytics/");
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!data) return (
        <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Activity className="w-12 h-12 text-indigo-500 animate-spin" />
                <p className="text-white/50 animate-pulse">Initializing Dashboard...</p>
            </div>
        </div>
    );

    const sentimentData = [
        { name: 'Positive', value: data.sentiment_distribution.positive, color: '#10b981' },
        { name: 'Negative', value: data.sentiment_distribution.negative, color: '#ef4444' },
        { name: 'Neutral', value: data.sentiment_distribution.neutral, color: '#6366f1' },
    ];

    const deptData = Object.entries(data.department_distribution).map(([key, value]) => ({
        name: key,
        articles: value
    }));

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Documents"
                    value={data.total_files}
                    icon={FileText}
                    color="indigo"
                    trend="+12%"
                    isPositive={true}
                />
                <StatCard
                    label="Extracted Articles"
                    value={data.total_articles}
                    icon={Newspaper}
                    color="violet"
                    trend="+5.4%"
                    isPositive={true}
                />
                <StatCard
                    label="Avg Sentiment"
                    value="74%"
                    icon={TrendingUp}
                    color="green"
                    trend="+2.1%"
                    isPositive={true}
                />
                <StatCard
                    label="Main Sector"
                    value={deptData.sort((a: any, b: any) => b.articles - a.articles)[0]?.name || "N/A"}
                    icon={Users}
                    color="pink"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sentiment Analysis */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-1 glass border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-indigo-500 to-pink-500 opacity-50" />
                    <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-indigo-400" />
                        Sentiment Profile
                    </h3>
                    <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sentimentData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {sentimentData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            className="drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-500"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-3 gap-4 w-full mt-6">
                        {sentimentData.map((s) => (
                            <div key={s.name} className="flex flex-col items-center">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                    <span className="text-[10px] text-white/50 uppercase font-bold">{s.name}</span>
                                </div>
                                <span className="text-lg font-bold text-white">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Department Breakout */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 glass border border-white/5 rounded-3xl p-8 overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
                    <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-pink-400" />
                        Departmental Distribution
                    </h3>
                    <div className="w-full h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="rgba(255,255,255,0.3)"
                                    fontSize={10}
                                    tick={{ fill: 'rgba(255,255,255,0.5)' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.3)"
                                    fontSize={10}
                                    tick={{ fill: 'rgba(255,255,255,0.5)' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                />
                                <Bar dataKey="articles" fill="url(#colorBar)" radius={[10, 10, 0, 0]} />
                                <defs>
                                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#ec4899" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
