"use client";

import { useState } from 'react';
import { BarChart2, TrendingUp, HelpCircle, ShieldAlert, Award } from 'lucide-react';

export default function ParetoChart({ data = [], totalDefects = 0 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 text-sm">
        No defect records available for Pareto analysis under selected filters.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 220; // SVG viewBox height for chart area

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">
              Pareto Defect Category Analysis
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              80 / 20 RULE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Categories highlighted in <span className="text-rose-400 font-semibold">Rose</span> represent the top 20% root causes accounting for ~80% of all line defects.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-rose-400 font-medium">
            <span className="w-3 h-3 rounded bg-rose-500"></span>
            <span>Vital 80% Causes</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
            <span className="w-3 h-3 rounded bg-cyan-600"></span>
            <span>Trivial Many</span>
          </div>
        </div>
      </div>

      {/* Dual Axis Pareto SVG Chart */}
      <div className="relative w-full overflow-x-auto pt-2">
        <svg viewBox="0 0 800 280" className="w-full h-auto max-h-[300px] overflow-visible">
          <defs>
            <linearGradient id="vitalBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#881337" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="normalBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#164e63" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Grid Background Horizontal Lines */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = chartHeight - (pct / 100) * (chartHeight - 30);
            return (
              <g key={pct}>
                <line x1="50" y1={y} x2="750" y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                <text x="40" y={y + 3} textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace">
                  {Math.round((pct / 100) * maxCount)}
                </text>
                <text x="760" y={y + 3} textAnchor="start" fill="#f59e0b" fontSize="10" fontFamily="monospace">
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* 80% Pareto Reference Line */}
          {(() => {
            const y80 = chartHeight - 0.8 * (chartHeight - 30);
            return (
              <g>
                <line x1="50" y1={y80} x2="750" y2={y80} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 5" />
                <rect x="360" y={y80 - 10} width="80" height="18" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
                <text x="400" y={y80 + 2} textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold">
                  80% Cutoff
                </text>
              </g>
            );
          })()}

          {/* Render Bars & Line Points */}
          {data.map((item, idx) => {
            const totalItems = data.length;
            const barWidth = Math.min(60, Math.max(25, 650 / totalItems - 15));
            const gap = (700 - totalItems * barWidth) / (totalItems + 1);
            const x = 50 + gap + idx * (barWidth + gap);

            const barHeight = (item.count / maxCount) * (chartHeight - 30);
            const yBar = chartHeight - barHeight;

            const cumY = chartHeight - (item.cumulativePercentage / 100) * (chartHeight - 30);

            // Compute line path to next point
            let nextPoint = '';
            if (idx < data.length - 1) {
              const nextItem = data[idx + 1];
              const nextX = 50 + gap + (idx + 1) * (barWidth + gap) + barWidth / 2;
              const nextCumY = chartHeight - (nextItem.cumulativePercentage / 100) * (chartHeight - 30);
              nextPoint = `L ${nextX} ${nextCumY}`;
            }

            const isHovered = hoveredIdx === idx;

            return (
              <g key={item.category} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
                {/* Bar */}
                <rect
                  x={x}
                  y={yBar}
                  width={barWidth}
                  height={barHeight}
                  rx="6"
                  fill={item.isParetoVital80 ? 'url(#vitalBar)' : 'url(#normalBar)'}
                  stroke={item.isParetoVital80 ? '#f43f5e' : '#06b6d4'}
                  strokeWidth={isHovered ? '2' : '1'}
                  className="transition-all duration-200 cursor-pointer"
                />

                {/* Bar Value Count Label */}
                <text
                  x={x + barWidth / 2}
                  y={yBar - 6}
                  textAnchor="middle"
                  fill={item.isParetoVital80 ? '#fecdd3' : '#cff4fc'}
                  fontSize="11"
                  fontWeight="bold"
                >
                  {item.count}
                </text>

                {/* X Axis Label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 18}
                  textAnchor="middle"
                  fill={isHovered ? '#ffffff' : '#94a3b8'}
                  fontSize="10"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {item.category.length > 14 ? item.category.slice(0, 12) + '…' : item.category}
                </text>

                {/* Cumulative Line Segment */}
                {idx < data.length - 1 && (
                  <line
                    x1={x + barWidth / 2}
                    y1={cumY}
                    x2={50 + gap + (idx + 1) * (barWidth + gap) + barWidth / 2}
                    y2={chartHeight - (data[idx + 1].cumulativePercentage / 100) * (chartHeight - 30)}
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />
                )}

                {/* Cumulative Line Point */}
                <circle
                  cx={x + barWidth / 2}
                  cy={cumY}
                  r={isHovered ? '6' : '4'}
                  fill="#f59e0b"
                  stroke="#0f172a"
                  strokeWidth="2"
                  className="cursor-pointer"
                />

                {/* Point Percentage Label */}
                <text
                  x={x + barWidth / 2}
                  y={cumY - 8}
                  textAnchor="middle"
                  fill="#fcd34d"
                  fontSize="9"
                  fontWeight="bold"
                >
                  {item.cumulativePercentage}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Pareto Summary Table */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-2 px-3">Defect Category</th>
              <th className="py-2 px-3 text-right">Occurrence Count</th>
              <th className="py-2 px-3 text-right">% Contribution</th>
              <th className="py-2 px-3 text-right">Cumulative %</th>
              <th className="py-2 px-3 text-center">Pareto Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {data.map((item) => (
              <tr key={item.category} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">{item.category}</td>
                <td className="py-2.5 px-3 text-right font-bold text-white">{item.count}</td>
                <td className="py-2.5 px-3 text-right text-slate-300">{item.percentage}%</td>
                <td className="py-2.5 px-3 text-right text-amber-400 font-bold">{item.cumulativePercentage}%</td>
                <td className="py-2.5 px-3 text-center font-sans">
                  {item.isParetoVital80 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                      Vital 80% Cause
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                      Trivial Many
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
