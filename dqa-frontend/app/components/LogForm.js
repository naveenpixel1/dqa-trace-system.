"use client";
import { useState } from 'react';

export default function LogForm() {
  const [tenantId, setTenantId] = useState('');
  const [stationId, setStationId] = useState('');
  const [status, setStatus] = useState('PASS');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://10.161.190.230:5000/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          station_id: stationId,
          status,
          notes
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Quality Log Recorded Successfully!' });
        setNotes('');
      } else {
        const errorText = Array.isArray(result.errors) ? result.errors.join(' ') : result.error;
        setMessage({ type: 'error', text: errorText || 'Failed to record log.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Cannot connect to backend server. Ensure it is running.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800">
      <h2 className="text-2xl font-bold mb-6 text-center text-emerald-400">DQA-Trace Operator Station</h2>
      
      {message.text && (
        <div className={`p-3 mb-4 rounded text-center text-sm font-semibold ${
          message.type === 'success' ? 'bg-emerald-950 text-emerald-300 border border-emerald-850' : 'bg-rose-950 text-rose-300 border border-rose-850'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Tenant ID (Factory Unit)</label>
          <input 
            type="text" placeholder="Paste Tenant UUID"
            value={tenantId} onChange={(e) => setTenantId(e.target.value)}
            className="w-full p-3 bg-slate-800 text-white rounded border border-slate-700 focus:outline-none focus:border-emerald-500 font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Station ID (Machine/Bench)</label>
          <input 
            type="text" placeholder="Paste Station UUID"
            value={stationId} onChange={(e) => setStationId(e.target.value)}
            className="w-full p-3 bg-slate-800 text-white rounded border border-slate-700 focus:outline-none focus:border-emerald-500 font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Quality Check Status</label>
          <div className="grid grid-cols-3 gap-3">
            {['PASS', 'FAIL', 'REWORK'].map((mode) => (
              <button
                key={mode} type="button" onClick={() => setStatus(mode)}
                className={`p-3 font-bold rounded tracking-wide border transition-all text-center ${
                  status === mode 
                    ? mode === 'PASS' ? 'bg-emerald-600 border-emerald-400 text-white scale-105' 
                      : mode === 'FAIL' ? 'bg-rose-600 border-rose-400 text-white scale-105'
                      : 'bg-amber-600 border-amber-400 text-white scale-105'
                    : 'bg-slate-800 border-slate-700 text-slate-400 opacity-60'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Defect Notes (Optional)</label>
          <textarea 
            placeholder="Type breakdown details or observations here..." rows="3"
            value={notes} onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 bg-slate-800 text-white rounded border border-slate-700 focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>
 <button 
  type="button" 
  disabled={loading}
  onClick={handleSubmit}
  className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-3 rounded font-bold transition-colors disabled:opacity-50 text-base shadow"
>
  {loading ? 'Submitting Data Log...' : 'Submit Quality Entry'}
</button>
      </div>
    </div>
  );
}