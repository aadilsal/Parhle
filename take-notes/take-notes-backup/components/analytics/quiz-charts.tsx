"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Stats = {
  scoreTrend?: { date: string; avg_score: number }[];
  performanceByTopic?: { topic: string; avg_score: number }[];
  recentAttempts?: any[];
};

const COLORS = ["#4f46e5", "#0ea5a4", "#ef4444", "#f59e0b", "#10b981"];

export default function QuizCharts({ stats }: { stats: Stats | null }) {
  const scoreTrend = stats?.scoreTrend || [];
  const byTopic = stats?.performanceByTopic || [];

  // Build distribution buckets: 0-49, 50-69, 70-84, 85-100
  const distribution = [
    { name: "0-49", value: 0 },
    { name: "50-69", value: 0 },
    { name: "70-84", value: 0 },
    { name: "85-100", value: 0 },
  ];

  (stats?.recentAttempts || []).forEach((a: any) => {
    const pct = a.max_score ? (a.score / a.max_score) * 100 : 0;
    if (pct < 50) distribution[0].value++;
    else if (pct < 70) distribution[1].value++;
    else if (pct < 85) distribution[2].value++;
    else distribution[3].value++;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="text-lg font-medium mb-2">Score Trend</h3>
          {scoreTrend.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v: any) => `${Math.round(v)}%`} />
                <Line type="monotone" dataKey="avg_score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-muted-foreground py-8 text-center">No trend data available.</div>
          )}
        </div>

        <div className="p-4 border rounded-lg bg-white">
          <h3 className="text-lg font-medium mb-2">Performance By Topic</h3>
          {byTopic.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byTopic} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="topic" type="category" width={140} />
                <Tooltip formatter={(v: any) => `${Math.round(v)}%`} />
                <Bar dataKey="avg_score" fill="#0ea5a4" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-muted-foreground py-8 text-center">No topic performance data.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="text-lg font-medium mb-2">Score Distribution</h3>
          {distribution.reduce((s, d) => s + d.value, 0) > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-muted-foreground py-8 text-center">No attempts to build distribution.</div>
          )}
        </div>

        <div className="col-span-1 lg:col-span-2 p-4 border rounded-lg bg-white">
          <h3 className="text-lg font-medium mb-2">Recent Attempts</h3>
          <div className="space-y-2">
            {(stats?.recentAttempts || []).slice(0, 6).map((a: any) => (
              <div key={a.id || Math.random()} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{a.quiz_title || 'Quiz'}</div>
                  <div className="text-xs text-muted-foreground">{new Date(a.completed_at).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{a.max_score ? `${Math.round((a.score / a.max_score) * 100)}%` : 'N/A'}</div>
                  <div className="text-xs text-muted-foreground">{a.total_time_elapsed ? `${Math.floor(a.total_time_elapsed/60)}m ${a.total_time_elapsed%60}s` : '-'}</div>
                </div>
              </div>
            ))}
            {(!stats?.recentAttempts || stats.recentAttempts.length === 0) && (
              <div className="text-sm text-muted-foreground py-8 text-center">No recent attempts</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
