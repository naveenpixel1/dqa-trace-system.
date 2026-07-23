"use client";

import { useEffect, useState, useRef } from 'react';

// Smooth animated counter component
function AnimatedCounter({ value, decimals = 0, suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const targetValue = value;
    if (startValue === targetValue) return;

    const duration = 600; // ms
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startValue + (targetValue - startValue) * easeProgress;
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
        prevValueRef.current = targetValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span>
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export default function KpiCard({
  title,
  value,
  decimals = 0,
  suffix = '',
  icon: Icon,
  colorTheme = 'emerald',
  badgeText,
  subtitle,
  loading = false
}) {
  const themeStyles = {
    cyan: {
      border: 'border-cyan-500/30 hover:border-cyan-500/50',
      bg: 'bg-gradient-to-br from-slate-900/90 via-slate-900 to-cyan-950/20',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.12)]',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      text: 'text-cyan-400',
      badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/40'
    },
    emerald: {
      border: 'border-emerald-500/30 hover:border-emerald-500/50',
      bg: 'bg-gradient-to-br from-slate-900/90 via-slate-900 to-emerald-950/20',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.12)]',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      text: 'text-emerald-400',
      badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
    },
    amber: {
      border: 'border-amber-500/30 hover:border-amber-500/50',
      bg: 'bg-gradient-to-br from-slate-900/90 via-slate-900 to-amber-950/20',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.12)]',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      text: 'text-amber-400',
      badge: 'bg-amber-950/60 text-amber-300 border-amber-800/40'
    },
    rose: {
      border: 'border-rose-500/30 hover:border-rose-500/50',
      bg: 'bg-gradient-to-br from-slate-900/90 via-slate-900 to-rose-950/20',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.12)]',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      text: 'text-rose-400',
      badge: 'bg-rose-950/60 text-rose-300 border-rose-800/40'
    }
  };

  const theme = themeStyles[colorTheme] || themeStyles.emerald;

  if (loading) {
    return (
      <div className={`p-5 rounded-2xl border bg-slate-900/80 border-slate-800 shadow-lg animate-pulse`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-28 bg-slate-800 rounded"></div>
          <div className="h-9 w-9 bg-slate-800 rounded-lg"></div>
        </div>
        <div className="h-8 w-20 bg-slate-800 rounded mb-2"></div>
        <div className="h-3 w-32 bg-slate-800/60 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`relative p-5 rounded-2xl border ${theme.border} ${theme.bg} ${theme.glow} transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl ${theme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${theme.text}`}>
          <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
        </span>
        {badgeText && (
          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${theme.badge}`}>
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-400 font-medium flex items-center gap-1.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}
