"use client";

import { useShift } from '../context/ShiftContext';
import KpiCard from './KpiCard';
import { 
  CheckCircle2, 
  TrendingUp, 
  RotateCcw, 
  AlertTriangle, 
  Clock, 
  Cpu, 
  Building2, 
  UserCheck, 
  RefreshCw 
} from 'lucide-react';

export default function ShiftDashboard() {
  const { 
    metrics, 
    isLoadingMetrics, 
    activeShift, 
    selectedTenantObj, 
    selectedStationObj, 
    operatorName, 
    fetchMetrics 
  } = useShift();

  return (
    <div className="w-full mb-8 space-y-4">
      {/* Active Shift Header Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              LIVE • SHIFT IN PROGRESS
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              {activeShift}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            Shift Performance Dashboard
          </h2>
        </div>

        {/* Station & Operator Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 flex items-center gap-1.5 font-mono">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Tenant:</span>
            <span className="text-cyan-300 font-semibold truncate max-w-[140px]">
              {selectedTenantObj?.name || 'SELECT TENANT'}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 flex items-center gap-1.5 font-mono">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">Station:</span>
            <span className="text-purple-300 font-semibold truncate max-w-[140px]">
              {selectedStationObj?.name || 'SELECT STATION'}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 flex items-center gap-1.5 font-mono">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Operator:</span>
            <span className="text-emerald-300 font-semibold">{operatorName.split(' ')[0]}</span>
          </div>

          <button
            onClick={fetchMetrics}
            title="Refresh Shift Metrics"
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingMetrics ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Inspected"
          value={metrics.totalInspected}
          suffix=" units"
          icon={CheckCircle2}
          colorTheme="cyan"
          subtitle={`${metrics.passCount} passed • ${metrics.failCount} failed`}
          loading={isLoadingMetrics}
        />

        <KpiCard
          title="Pass Rate"
          value={metrics.passRate}
          decimals={1}
          suffix="%"
          icon={TrendingUp}
          colorTheme={metrics.passRate >= 95 ? 'emerald' : metrics.passRate >= 85 ? 'amber' : 'rose'}
          badgeText={metrics.passRate >= 95 ? 'Target Met' : 'Needs Attention'}
          subtitle="Target: ≥ 95.0%"
          loading={isLoadingMetrics}
        />

        <KpiCard
          title="Rework Count"
          value={metrics.reworkCount}
          suffix=" items"
          icon={RotateCcw}
          colorTheme="amber"
          subtitle="Marked for line correction"
          loading={isLoadingMetrics}
        />

        <KpiCard
          title="Defect Count"
          value={metrics.defectCount}
          suffix=" defects"
          icon={AlertTriangle}
          colorTheme="rose"
          subtitle="Recorded during shift"
          loading={isLoadingMetrics}
        />
      </div>
    </div>
  );
}
