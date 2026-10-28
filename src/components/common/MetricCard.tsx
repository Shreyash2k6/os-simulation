import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  color?: 'blue' | 'cyan' | 'violet' | 'amber' | 'emerald' | 'rose';
  icon?: React.ReactNode;
}

const COLOR_STYLES = {
  blue: {
    border: 'border-blue-500/25 dark:border-[#4F80FF]/30',
    text: 'text-blue-600 dark:text-[#4F80FF]',
    bg: 'bg-blue-500/[0.04] dark:bg-[#4F80FF]/[0.06]',
    radial: 'from-blue-500/10 to-transparent',
    glow: 'hover:shadow-[0_0_24px_rgba(79,128,255,0.18)]'
  },
  cyan: {
    border: 'border-teal-500/25 dark:border-[#2DD4BF]/30',
    text: 'text-teal-600 dark:text-[#2DD4BF]',
    bg: 'bg-teal-500/[0.04] dark:bg-[#2DD4BF]/[0.06]',
    radial: 'from-teal-500/10 to-transparent',
    glow: 'hover:shadow-[0_0_24px_rgba(45,212,191,0.18)]'
  },
  violet: {
    border: 'border-purple-500/25 dark:border-[#906DF7]/30',
    text: 'text-purple-600 dark:text-[#906DF7]',
    bg: 'bg-purple-500/[0.04] dark:bg-[#906DF7]/[0.06]',
    radial: 'from-purple-500/10 to-transparent',
    glow: 'hover:shadow-[0_0_24px_rgba(144,109,247,0.18)]'
  },
  amber: {
    border: 'border-amber-500/25 dark:border-[#F59E0B]/30',
    text: 'text-amber-600 dark:text-[#F59E0B]',
    bg: 'bg-amber-500/[0.04] dark:bg-[#F59E0B]/[0.06]',
    radial: 'from-amber-500/10 to-transparent',
    glow: 'hover:shadow-[0_0_24px_rgba(245,158,11,0.18)]'
  },
  emerald: {
    border: 'border-emerald-500/25 dark:border-[#10B981]/30',
    text: 'text-emerald-600 dark:text-[#10B981]',
    bg: 'bg-emerald-500/[0.04] dark:bg-[#10B981]/[0.06]',
    radial: 'from-emerald-500/10 to-transparent',
    glow: 'hover:shadow-[0_0_24px_rgba(16,185,129,0.18)]'
  },
  rose: {
    border: 'border-rose-500/25 dark:border-[#F43F5E]/30',
    text: 'text-rose-600 dark:text-[#F43F5E]',
    bg: 'bg-rose-500/[0.04] dark:bg-[#F43F5E]/[0.06]',
    radial: 'from-rose-500/10 to-transparent',
    glow: 'hover:shadow-[0_0_24px_rgba(244,63,94,0.18)]'
  }
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtext,
  color = 'cyan',
  icon
}) => {
  const c = COLOR_STYLES[color];

  return (
    <div className={`p-4 rounded-2xl glass-panel ${c.border} ${c.bg} ${c.glow} transition-all duration-300 relative overflow-hidden group`}>
      {/* Ambient gradient corner flare */}
      <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full bg-gradient-to-br ${c.radial} blur-xl pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-center justify-between mb-2 relative z-10">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text-secondary)] opacity-90">{label}</span>
        {icon && <div className={`${c.text} opacity-90 group-hover:scale-110 transition-transform`}>{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1.5 relative z-10">
        <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${c.text}`}>{value}</span>
        {unit && <span className="text-xs text-[var(--text-muted)] font-mono">{unit}</span>}
      </div>
      {subtext && <div className="text-[11px] text-[var(--text-muted)] mt-1.5 truncate relative z-10">{subtext}</div>}
    </div>
  );
};
