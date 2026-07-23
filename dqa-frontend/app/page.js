"use client";

import { ShiftProvider, useShift } from './context/ShiftContext';
import ShiftDashboard from './components/ShiftDashboard';
import LogForm from './components/LogForm';
import ManagerAnalyticsView from './components/ManagerAnalyticsView';
import QualityAlertsPanel from './components/QualityAlertsPanel';
import IotEdgeSimulator from './components/IotEdgeSimulator';
import Toast from './components/Toast';
import { LayoutDashboard, BarChart2, Cpu, Radio } from 'lucide-react';

function DashboardApp() {
  const { viewMode, setViewMode, activeAlertsCount } = useShift();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl space-y-6">
        {/* Main Top Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
              D
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                DQA-Trace System
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Digital Quality Assurance & Industry 4.0 IoT Edge Integration
              </p>
            </div>
          </div>

          {/* Navigation View Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 flex-wrap">
            <button
              onClick={() => setViewMode('operator')}
              className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
                viewMode === 'operator'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-4 h-4" />
              Operator Station
            </button>

            <button
              onClick={() => setViewMode('manager')}
              className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all relative ${
                viewMode === 'manager'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Manager Analytics
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-bounce shadow">
                  {activeAlertsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setViewMode('iot')}
              className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
                viewMode === 'iot'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Radio className="w-4 h-4" />
              IoT Edge Control
            </button>
          </div>
        </header>

        {/* Emergency Quality Spike Alerts Panel */}
        <QualityAlertsPanel />

        {/* Dynamic View Mode Content */}
        {viewMode === 'operator' ? (
          <>
            <ShiftDashboard />
            <LogForm />
          </>
        ) : viewMode === 'manager' ? (
          <ManagerAnalyticsView />
        ) : (
          <IotEdgeSimulator />
        )}
      </div>

      {/* Real-time Toast Notifications */}
      <Toast />
    </main>
  );
}

export default function Home() {
  return (
    <ShiftProvider>
      <DashboardApp />
    </ShiftProvider>
  );
}
