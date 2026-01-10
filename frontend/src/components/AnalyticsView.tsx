"use client";

import React, { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { motion } from "framer-motion";
import {
    Activity,
    Target,
    Globe,
    Zap,
    TrendingUp,
    PieChart as PieChartIcon
} from "lucide-react";

export function AnalyticsView() {
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

    if (!data) return null;

    const sentimentData = [
        { name: 'Positive', value: data.sentiment_distribution.positive, color: '#10b981' },
        { name: 'Negative', value: data.sentiment_distribution.negative, color: '#ef4444' },
        { name: 'Neutral', value: data.sentiment_distribution.neutral, color: '#6366f1' },
    ];

    const deptData = Object.entries(data.department_distribution).map(([key, value]) => ({
        name: key,
        articles: value
    }));

    // Faking some time series data for the "Activity" chart
    const timeData = [
        { time: '09:00', load: 12 },
        { time: '10:00', load: 35 },
        { time: '11:00', load: 25 },
        { time: '12:00', load: 45 },
        { time: '13:00', load: 60 },
        { time: '14:00', load: 55 },
        { time: '15:00', load: 70 },
    ];

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Sentiment Analysis */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass border border-white/5 rounded-[2.5rem] p-10 overflow-hidden relative"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                            <PieChartIcon className="text-indigo-400 w-6 h-6" />
                            Emotional Landscape
                        </h3>
                        <span className="text-[10px] font-bold text-indigo-400 border border-indigo-400/20 px-3 py-1 rounded-full uppercase">Real-time Analysis</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="h-64 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sentimentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={10}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {sentimentData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                <span className="text-3xl font-bold">{data.total_articles}</span>
                                <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Articles</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {sentimentData.map((s) => (
                                <div key={s.name} className="flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-white/50 uppercase tracking-widest">{s.name}</span>
                                        <span className="text-sm font-bold text-white">{((s.value / data.total_articles) * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(s.value / data.total_articles) * 100}%` }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: s.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Processing Load */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass border border-white/5 rounded-[2.5rem] p-10 overflow-hidden relative"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                            <Zap className="text-pink-400 w-6 h-6" />
                            Processing Throughput
                        </h3>
                        <span className="text-[10px] font-bold text-pink-400 border border-pink-400/20 px-3 py-1 rounded-full uppercase">Compute Load</span>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timeData}>
                                <defs>
                                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis hide domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                                />
                                <Area type="monotone" dataKey="load" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorLoad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Peak Load</span>
                            <span className="text-xl font-bold text-white">74.2%</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Latency</span>
                            <span className="text-xl font-bold text-white">142ms</span>
                        </div>
                    </div>
                </motion.div>

                {/* Global Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 glass border border-white/5 rounded-[2.5rem] p-10 overflow-hidden relative"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                            <Globe className="text-indigo-400 w-6 h-6" />
                            Top Information Sectors
                        </h3>
                        <span className="text-[10px] font-bold text-indigo-400 border border-indigo-400/20 px-3 py-1 rounded-full uppercase">Intelligence Mapping</span>
                    </div>

                    <div className="w-full h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptData} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    stroke="rgba(255,255,255,0.5)"
                                    fontSize={12}
                                    width={150}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                                />
                                <Bar dataKey="articles" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
