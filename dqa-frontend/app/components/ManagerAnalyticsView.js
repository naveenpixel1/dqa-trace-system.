"use client";

import { useState, useEffect } from 'react';
import { useShift } from '../context/ShiftContext';
import SearchableSelect from './SearchableSelect';
import ParetoChart from './ParetoChart';
import KpiCard from './KpiCard';
import { 
  Building2, 
  Cpu, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ShieldAlert, 
  Activity,
  RotateCcw,
  UserCheck,
  Check
} from 'lucide-react';

export default function ManagerAnalyticsView() {
  const { 
    tenants, 
    stations, 
    alerts, 
    fetchParetoAnalytics, 
    acknowledgeAlert, 
    resolveAlert 
  } = useShift();

  // Filters state
  const [filterTenant, setFilterTenant] = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('all');

  const [paretoData, setParetoData] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalInspected: 0,
    totalDefects: 0,
    failCount: 0,
    reworkCount: 0,
    passRate: 100.0,
    mostFrequentDefect: 'None',
    highestFailureStation: 'None'
  });
  const [loading, setLoading] = useState(true);

  // Resolution modal state for historical table
  const [resolvingAlertId, setResolvingAlertId] = useState(null);
  const [resolveNoteText, setResolveNoteText] = useState('');

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetchParetoAnalytics({
        tenant_id: filterTenant,
        station_id: filterStation,
        shift: filterShift,
        dateRange: filterDateRange
      });

      if (res && res.summary) {
        setSummaryMetrics(res.summary);
        setParetoData(res.paretoData || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [filterTenant, filterStation, filterShift, filterDateRange]);

  const handleResolveSubmit = async (alertId) => {
    await resolveAlert(alertId, resolveNoteText || 'Station recalibrated & verified');
    setResolvingAlertId(null);
    setResolveNoteText('');
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">Analytics Filter Console</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs w-full md:w-auto">
          {/* Tenant Filter */}
          <div className="w-full min-w-[160px]">
            <select
              value={filterTenant}
              onChange={(e) => setFilterTenant(e.target.value)}
              className="w-full p-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 text-xs"
            >
              <option value="">All Factory Units (Tenants)</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Station Filter */}
          <div className="w-full min-w-[160px]">
            <select
              value={filterStation}
              onChange={(e) => setFilterStation(e.target.value)}
              className="w-full p-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 text-xs"
            >
              <option value="">All Machine Benches (Stations)</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Shift Filter */}
          <div className="w-full min-w-[140px]">
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="w-full p-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 text-xs font-semibold"
            >
              <option value="">All Shifts</option>
              <option value="Shift A (06:00 - 14:00)">Shift A (Day)</option>
              <option value="Shift B (14:00 - 22:00)">Shift B (Evening)</option>
              <option value="Shift C (22:00 - 06:00)">Shift C (Night)</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="w-full min-w-[130px]">
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="w-full p-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 text-xs font-semibold"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Recorded Defects"
          value={summaryMetrics.totalDefects}
          suffix=" defects"
          icon={AlertTriangle}
          colorTheme="rose"
          subtitle={`Across ${summaryMetrics.failCount} failed inspections`}
          loading={loading}
        />

        <KpiCard
          title="Overall Pass Rate"
          value={summaryMetrics.passRate}
          decimals={1}
          suffix="%"
          icon={TrendingUp}
          colorTheme={summaryMetrics.passRate >= 95 ? 'emerald' : summaryMetrics.passRate >= 85 ? 'amber' : 'rose'}
          badgeText={summaryMetrics.passRate >= 95 ? 'Optimal' : 'Low Pass Rate'}
          subtitle={`Target ≥ 95.0%`}
          loading={loading}
        />

        <KpiCard
          title="Top Defect Category"
          value={summaryMetrics.mostFrequentDefect}
          icon={ShieldAlert}
          colorTheme="amber"
          subtitle="Highest occurrence root cause"
          loading={loading}
        />

        <KpiCard
          title="Highest Failure Station"
          value={summaryMetrics.highestFailureStation}
          icon={Cpu}
          colorTheme="cyan"
          subtitle="Requires maintenance focus"
          loading={loading}
        />
      </div>

      {/* Dual Axis Pareto Chart */}
      <ParetoChart data={paretoData} totalDefects={summaryMetrics.totalDefects} />

      {/* Quality Incident Spike Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Quality Spike Alerts History (3 Consecutive FAIL Rule)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            {alerts.length} Incidents Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Alert ID</th>
                <th className="py-2.5 px-3">Station / Factory</th>
                <th className="py-2.5 px-3">Trigger Time</th>
                <th className="py-2.5 px-3">Observed Defects</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-white">{alert.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-sans font-semibold text-slate-200">{alert.station_name}</div>
                      <div className="text-[10px] text-slate-400">{alert.tenant_name}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {new Date(alert.trigger_time).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-rose-300 font-sans text-[11px]">
                      {alert.recent_defects.join(', ')}
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      {alert.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                          Active Spike
                        </span>
                      ) : alert.status === 'Acknowledged' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          Acknowledged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          <Check className="w-3 h-3 text-emerald-400" />
                          Resolved
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      {alert.status === 'Active' && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id, 'Supervisor #1')}
                          className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-amber-400 mr-2"
                        >
                          Ack
                        </button>
                      )}
                      {alert.status !== 'Resolved' && (
                        <button
                          onClick={() => setResolvingAlertId(alert.id)}
                          className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-emerald-400"
                        >
                          Resolve
                        </button>
                      )}
                      {alert.status === 'Resolved' && (
                        <span className="text-[10px] text-slate-400 italic">
                          Notes: {alert.resolution_notes}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-500 font-sans">
                    No quality spike incidents logged. Station stability is optimal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Resolve Inline Modal */}
      {resolvingAlertId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Resolve Incident {resolvingAlertId}</h3>
            <textarea
              rows="3"
              value={resolveNoteText}
              onChange={(e) => setResolveNoteText(e.target.value)}
              placeholder="Enter resolution notes / machine calibration steps taken..."
              className="w-full p-3 bg-slate-950 text-white rounded-xl border border-slate-800 text-xs"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setResolvingAlertId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolveSubmit(resolvingAlertId)}
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
              >
                Submit Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
