"use client";

import { useState, useEffect } from 'react';
import { useShift } from '../context/ShiftContext';
import { 
  Cpu, 
  Wifi, 
  Radio, 
  Send, 
  Zap, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  RefreshCw,
  Server,
  Activity
} from 'lucide-react';

export default function IotEdgeSimulator() {
  const { edgeDevices, edgeTelemetry, fetchEdgeDevices, triggerEdgeSimulation, showToast } = useShift();

  const [selectedDevice, setSelectedDevice] = useState('ESP32-001');
  const [triggerStatus, setTriggerStatus] = useState('PASS');
  const [customBarcode, setCustomBarcode] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchEdgeDevices();
  }, [fetchEdgeDevices]);

  const handleSendSingleEvent = async () => {
    setIsSending(true);
    try {
      const barcode = customBarcode.trim() || `LOT-IOT-${Date.now().toString().slice(-6)}`;
      const res = await triggerEdgeSimulation({
        deviceId: selectedDevice,
        status: triggerStatus,
        barcode
      });

      if (res && res.success) {
        showToast(`IoT Telemetry sent from ${selectedDevice} (${triggerStatus})`, 'success');
        if (res.data?.triggeredAlert) {
          showToast(`🚨 HIGH SEVERITY SPIKE ALERT triggered from ${selectedDevice}!`, 'error');
        }
      }
    } finally {
      setIsSending(false);
    }
  };

  // Trigger 3 consecutive FAILs burst to demonstrate automated spike alert
  const handleTriggerSpikeBurst = async () => {
    setIsSending(true);
    showToast('Dispatching 3 consecutive FAIL hardware events to test spike alert...', 'warning');

    try {
      for (let i = 1; i <= 3; i++) {
        await triggerEdgeSimulation({
          deviceId: selectedDevice,
          status: 'FAIL',
          barcode: `LOT-FAIL-SPIKE-00${i}`
        });
        await new Promise((r) => setTimeout(r, 200));
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white tracking-tight">Industry 4.0 IoT & Edge Device Control</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time API endpoint <span className="font-mono text-cyan-300">POST /api/v1/edge-sensor</span> authenticated via <span className="font-mono text-slate-300">x-api-key</span>.
          </p>
        </div>

        <button
          onClick={fetchEdgeDevices}
          className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Registry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Device Registry Table */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Connected Edge Registry</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {edgeDevices.length} Devices Online
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Device ID / Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Firmware</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {edgeDevices.map((dev) => (
                  <tr key={dev.deviceId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{dev.deviceId}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{dev.deviceName}</div>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {dev.deviceType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{dev.ipAddress}</td>
                    <td className="py-3 px-3 text-slate-400">{dev.firmwareVersion}</td>
                    <td className="py-3 px-3 text-right font-sans">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        dev.status === 'Online'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dev.status === 'Online' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {dev.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hardware Simulator Controls */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hardware Telemetry Simulator</h3>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Live Testing
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Target Device Selection */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                Target Hardware Device
              </label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full p-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono text-xs"
              >
                {edgeDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.deviceId} - {d.deviceName}
                  </option>
                ))}
              </select>
            </div>

            {/* Quality Status Trigger */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                Sensor Inspection Signal
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'PASS', label: 'PASS', active: 'bg-emerald-600 border-emerald-400 text-white' },
                  { id: 'FAIL', label: 'FAIL', active: 'bg-rose-600 border-rose-400 text-white' },
                  { id: 'REWORK', label: 'REWORK', active: 'bg-amber-600 border-amber-400 text-white' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTriggerStatus(item.id)}
                    className={`p-2.5 rounded-xl font-bold border transition-all text-center ${
                      triggerStatus === item.id
                        ? item.active
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Barcode Override */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                Scanned Unit / Barcode
              </label>
              <input
                type="text"
                value={customBarcode}
                onChange={(e) => setCustomBarcode(e.target.value)}
                placeholder="Auto-generates if empty (e.g. LOT-ESP32-901)"
                className="w-full p-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                disabled={isSending}
                onClick={handleSendSingleEvent}
                className="w-full p-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow transition-all transform active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Dispatch Edge Telemetry Payload
              </button>

              <button
                type="button"
                disabled={isSending}
                onClick={handleTriggerSpikeBurst}
                className="w-full p-2.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-rose-400" />
                Trigger 3 Consecutive FAILs Spike
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Telemetry Logs Stream */}
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Live IoT Ingestion Telemetry Stream</span>
          </div>
          <span className="text-[10px] text-slate-500">Auto-refreshing</span>
        </div>

        <div className="max-h-44 overflow-y-auto space-y-1.5 text-[11px]">
          {edgeTelemetry.length > 0 ? (
            edgeTelemetry.map((log) => (
              <div key={log.id || log.receivedAt} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-cyan-400 font-bold">[{log.deviceId}]</span>
                  <span className="text-slate-300 font-semibold">{log.sensorType}</span>
                  <span className="text-slate-500 truncate">Barcode: {log.barcode || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    log.status === 'PASS' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {log.status}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(log.receivedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-slate-600 italic">
              No IoT hardware events logged yet. Use the Hardware Simulator controls above to test real-time ingestion.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
