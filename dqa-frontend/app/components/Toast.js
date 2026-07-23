"use client";

import { useEffect } from 'react';
import { useShift } from '../context/ShiftContext';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';

export default function Toast() {
  const { toast, hideToast } = useShift();

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show, toast.id, hideToast]);

  if (!toast.show) return null;

  const styles = {
    success: {
      bg: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      bar: 'bg-emerald-400'
    },
    error: {
      bg: 'bg-rose-950/90 border-rose-500/40 text-rose-200',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      bar: 'bg-rose-400'
    },
    warning: {
      bg: 'bg-amber-950/90 border-amber-500/40 text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      bar: 'bg-amber-400'
    }
  };

  const currentStyle = styles[toast.type] || styles.success;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`relative p-4 rounded-xl border backdrop-blur-md shadow-2xl ${currentStyle.bg} flex items-center justify-between gap-3 overflow-hidden`}>
        <div className="flex items-center gap-3">
          {currentStyle.icon}
          <p className="text-sm font-medium text-slate-100">{toast.message}</p>
        </div>
        <button
          onClick={hideToast}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated Progress Bar */}
        <div className={`absolute bottom-0 left-0 h-1 ${currentStyle.bar} animate-[shrink_3.5s_linear_forwards]`} style={{ width: '100%' }} />
      </div>
    </div>
  );
}
