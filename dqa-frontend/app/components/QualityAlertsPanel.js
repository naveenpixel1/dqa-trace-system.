"use client";

import { useState } from 'react';
import { useShift } from '../context/ShiftContext';
import { 
  AlertOctagon, 
  CheckCircle2, 
  UserCheck, 
  Clock, 
  ShieldAlert, 
  Wrench, 
  PhoneCall, 
  Octagon, 
  Check, 
  X 
} from 'lucide-react';

export default function QualityAlertsPanel() {
  const { alerts, acknowledgeAlert, resolveAlert } = useShift();
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const activeAlerts = alerts.filter((a) => a.status === 'Active' || a.status === 'Acknowledged');

  if (activeAlerts.length === 0) return null;

  const currentAlert = selectedAlert || activeAlerts[0];

  const handleAcknowledge = async (alertId) => {
    await acknowledgeAlert(alertId, 'Supervisor #1');
  };

  const handleResolve = async (e) => {
    if (e) e.preventDefault();
    if (!currentAlert) return;

    setIsResolving(true);
    try {
      await resolveAlert(currentAlert.id, resolutionNotes || 'Machine recalibrated and quality verified.');
      setSelectedAlert(null);
      setResolutionNotes('');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="w-full mb-6 space-y-3">
      {/* Emergency Alert Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-slate-950 border-2 border-rose-500 p-4 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.3)] animate-pulse flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 shadow-lg">
            <AlertOctagon className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-slate-950 uppercase tracking-wider">
                HIGH SEVERITY QUALITY SPIKE
              </span>
              <span className="text-xs text-rose-200 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(currentAlert.trigger_time).toLocaleTimeString()}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-1">
              Station Alert: {currentAlert.station_name}
            </h3>
            <p className="text-xs text-rose-200">
              Triggered by <span className="font-bold text-white">{currentAlert.consecutive_fail_count} consecutive FAILs</span> within <span className="font-bold text-white">{currentAlert.time_window_minutes} minutes</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentAlert.status === 'Active' ? (
            <button
              onClick={() => handleAcknowledge(currentAlert.id)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow transition-all transform active:scale-95"
            >
              Acknowledge Alert
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-amber-950 border border-amber-500/60 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              Acknowledged by {currentAlert.acknowledged_by || 'Supervisor'}
            </span>
          )}

          <button
            onClick={() => setSelectedAlert(currentAlert)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs shadow transition-all transform active:scale-95"
          >
            Resolve & Actions
          </button>
        </div>
      </div>

      {/* Alert Resolution Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-bold text-white">Quality Incident Resolution</h3>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Incident Summary Info */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Station:</span>
                <span className="font-bold text-white">{selectedAlert.station_name}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Factory Unit:</span>
                <span className="font-bold text-white">{selectedAlert.tenant_name}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Observed Defect Tags:</span>
                <span className="font-bold text-rose-300">
                  {selectedAlert.recent_defects.join(', ')}
                </span>
              </div>
            </div>

            {/* Recommended Protocol Actions */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Standard Emergency Protocol
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 flex flex-col items-center text-center gap-1">
                  <Octagon className="w-5 h-5 text-rose-400" />
                  <span className="font-bold">1. Pause Line</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 flex flex-col items-center text-center gap-1">
                  <Wrench className="w-5 h-5 text-amber-400" />
                  <span className="font-bold">2. Inspect Machine</span>
                </div>
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-200 flex flex-col items-center text-center gap-1">
                  <PhoneCall className="w-5 h-5 text-cyan-400" />
                  <span className="font-bold">3. Escalate Quality</span>
                </div>
              </div>
            </div>

            {/* Resolution Form */}
            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Resolution Notes & Corrective Actions Taken
                </label>
                <textarea
                  rows="3"
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail root cause analysis, tooling adjustments, or calibration steps..."
                  className="w-full p-3 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 text-xs shadow-inner"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isResolving}
                  className="flex-1 p-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow"
                >
                  <Check className="w-4 h-4" />
                  Mark Incident as Resolved
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-semibold text-xs hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
