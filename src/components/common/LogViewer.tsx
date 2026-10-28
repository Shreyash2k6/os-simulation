import React, { useRef, useEffect } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

interface LogViewerProps {
  logs: string[];
  activeStep?: number;
  title?: string;
  maxHeight?: string;
}

export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  activeStep,
  title = 'Simulation Event Log',
  maxHeight = 'max-h-52'
}) => {
  const [copied, setCopied] = React.useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length, activeStep]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLogBadge = (log: string) => {
    if (log.includes('Fault') || log.includes('BLOCKED') || log.includes('failed') || log.includes('DEADLOCK')) {
      return <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">ALERT</span>;
    }
    if (log.includes('Hit') || log.includes('completed') || log.includes('Allocated') || log.includes('SAFE')) {
      return <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">SUCCESS</span>;
    }
    if (log.includes('wrap') || log.includes('sweep') || log.includes('re-queued') || log.includes('waiting')) {
      return <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">INFO</span>;
    }
    return <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-[#4F80FF] border border-blue-500/30 uppercase">EVENT</span>;
  };

  return (
    <div className="rounded-2xl glass-panel border border-[var(--glass-border)] overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60 dark:bg-black/50 border-b border-[var(--glass-border)] text-xs">
        <div className="flex items-center gap-2 font-mono text-[var(--text-secondary)]">
          <Terminal className="w-3.5 h-3.5 text-[#2DD4BF]" />
          <span className="font-bold text-[var(--text-primary)]">{title}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-[var(--text-muted)] font-mono border border-white/5">
            {logs.length} events
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer px-2 py-1 rounded-md hover:bg-white/5"
          title="Copy log to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className={`p-3.5 font-mono text-[11px] space-y-1.5 overflow-y-auto ${maxHeight} bg-slate-950/70 dark:bg-black/60`}>
        {logs.length === 0 ? (
          <div className="text-[var(--text-muted)] italic py-2">No execution events recorded yet. Run or step the simulation to inspect state transitions.</div>
        ) : (
          logs.map((log, idx) => {
            const isHighlighted = activeStep !== undefined && idx === activeStep - 1;
            return (
              <div
                key={idx}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-start gap-2.5 ${
                  isHighlighted
                    ? 'bg-blue-500/20 text-[#2DD4BF] border-l-3 border-[#2DD4BF] shadow-sm font-semibold'
                    : 'text-slate-300 dark:text-white/80 hover:bg-white/[0.03]'
                }`}
              >
                <span className="text-slate-500 select-none shrink-0 w-7 text-right font-mono">#{idx + 1}</span>
                <span className="shrink-0">{getLogBadge(log)}</span>
                <span className="break-all leading-relaxed">{log}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
