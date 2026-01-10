"use client";

import { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

export default function Dashboard() {
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
        // Poll every 5 seconds for updates
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!data) return <div className="p-4">Loading Analytics...</div>;

    const sentimentData = [
        { name: 'Positive', value: data.sentiment_distribution.positive, color: '#4ade80' },
        { name: 'Negative', value: data.sentiment_distribution.negative, color: '#f87171' },
        { name: 'Neutral', value: data.sentiment_distribution.neutral, color: '#94a3b8' },
    ];

    const deptData = Object.entries(data.department_distribution).map(([key, value]) => ({
        name: key,
        articles: value
    }));

    return (
        <div className="p-6 bg-white rounded-xl shadow-md space-y-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">Live Analytics Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Total Files</p>
                    <p className="text-3xl font-bold text-blue-900">{data.total_files}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-sm text-indigo-600 font-medium">Total Articles</p>
                    <p className="text-3xl font-bold text-indigo-900">{data.total_articles}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Top Department</p>
                    <p className="text-xl font-bold text-purple-900 truncate">
                        {deptData.sort((a: any, b: any) => b.articles - a.articles)[0]?.name || "N/A"}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-80">
                <div className="border p-4 rounded-lg">
                    <h3 className="font-semibold mb-4 text-center">Sentiment Distribution</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={sentimentData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {sentimentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="border p-4 rounded-lg">
                    <h3 className="font-semibold mb-4 text-center">Articles by Department</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deptData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="articles" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
