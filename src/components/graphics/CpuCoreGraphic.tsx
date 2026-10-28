import React from 'react';
import { CPUStepSnapshot, ProcessInput } from '../../engine/cpu/types';
import { Cpu, Zap, Activity, ArrowRight, CheckCircle2, Flame, Layers } from 'lucide-react';

interface CpuCoreGraphicProps {
  snapshot: CPUStepSnapshot | null;
  processes: ProcessInput[];
  currentTime: number;
  totalTime: number;
}

export const CpuCoreGraphic: React.FC<CpuCoreGraphicProps> = ({
  snapshot,
  processes,
  currentTime,
  totalTime,
}) => {
  const runningProc = processes.find((p) => p.id === snapshot?.runningProcessId);
  const readyProcs = processes.filter((p) => snapshot?.readyQueue?.includes(p.id) ?? false);
  const completedProcs = processes.filter((p) => snapshot?.completedProcesses?.includes(p.id) ?? false);

  return (
    <div className="glass-panel-elevated rounded-2xl p-5 border border-[var(--glass-border)] space-y-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Interactive Hardware CPU Architecture</h2>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">Live execution pipeline, instruction socket, and queue flow</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[var(--text-secondary)]">Cycle Clock:</span>
          <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-bold">
            t = {currentTime} ticks
          </span>
        </div>
      </div>

      {/* Main Graphical Architecture Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Stage 1: Ready Queue Conveyor Belt (Left) */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Ready Queue Queue Track
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
              {readyProcs.length} waiting
            </span>
          </div>

          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {readyProcs.length === 0 ? (
              <div className="text-center py-6 text-xs text-[var(--text-muted)] italic font-mono">
                Queue is empty (no waiting processes)
              </div>
            ) : (
              readyProcs.map((proc, idx) => {
                const burstRemaining = snapshot?.remainingBurstTimes[proc.id] ?? proc.burstTime;
                return (
                  <div
                    key={proc.id}
                    className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--glass-border)] flex items-center justify-between text-xs font-mono transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: proc.color }} />
                      <span className="font-bold text-[var(--text-primary)]">{proc.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-purple-400 font-semibold">Pri {proc.priority}</span>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-bold">
                        {burstRemaining}t left
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-center gap-1 text-[10px] text-[var(--text-muted)] font-mono pt-1 border-t border-[var(--glass-border)]">
            <span>Scheduler Dispatch Vector</span>
            <ArrowRight className="w-3 h-3 text-cyan-400" />
          </div>
        </div>

        {/* Stage 2: Central Silicon Core & Execution Die (Center) */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-secondary)] border-2 border-indigo-500/40 relative overflow-hidden flex flex-col justify-between shadow-lg">
          {/* Silicon circuit trace background effect */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#4F80FF_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
              CPU Core #0 Die Socket
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              runningProc 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/20' 
                : 'bg-gray-500/20 text-gray-400 border-gray-500/40'
            }`}>
              {runningProc ? 'BUSY (EXECUTING)' : 'IDLE CYCLE'}
            </span>
          </div>

          {/* Core Hardware Socket Visual */}
          <div className="my-3 py-4 px-6 rounded-2xl bg-[var(--bg-primary)]/80 border border-indigo-500/30 text-center relative z-10 shadow-inner flex flex-col items-center justify-center min-h-[110px]">
            {runningProc ? (
              <div className="space-y-1.5 w-full">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full animate-ping" style={{ backgroundColor: runningProc.color }} />
                  <span className="text-xl font-extrabold font-mono text-[var(--text-primary)] tracking-tight">
                    {runningProc.name}
                  </span>
                </div>
                <div className="text-xs text-cyan-400 font-mono font-semibold">
                  Instruction Execution: Burst {snapshot?.remainingBurstTimes[runningProc.id] ?? 0}t remaining
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-[var(--bg-secondary)] h-2 rounded-full overflow-hidden border border-[var(--glass-border)] mt-2">
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      backgroundColor: runningProc.color,
                      width: `${Math.max(5, (1 - ((snapshot?.remainingBurstTimes[runningProc.id] ?? 0) / runningProc.burstTime)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Activity className="w-6 h-6 text-[var(--text-muted)] mx-auto animate-pulse" />
                <span className="text-xs font-mono text-[var(--text-muted)] font-semibold block">
                  CPU Idle (Waiting for Arrivals)
                </span>
              </div>
            )}
          </div>

          {/* Micro-architecture Registers Strip */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono relative z-10 pt-2 border-t border-[var(--glass-border)]">
            <div className="p-1.5 rounded bg-[var(--bg-secondary)] border border-[var(--glass-border)]">
              <span className="text-[var(--text-muted)] block text-[9px]">ALU STATUS</span>
              <span className="text-emerald-400 font-bold">{runningProc ? 'ACTIVE' : 'IDLE'}</span>
            </div>
            <div className="p-1.5 rounded bg-[var(--bg-secondary)] border border-[var(--glass-border)]">
              <span className="text-[var(--text-muted)] block text-[9px]">INTERRUPT</span>
              <span className="text-cyan-400 font-bold">{snapshot?.isContextSwitch ? 'SWITCH' : 'NORM'}</span>
            </div>
            <div className="p-1.5 rounded bg-[var(--bg-secondary)] border border-[var(--glass-border)]">
              <span className="text-[var(--text-muted)] block text-[9px]">UTILIZATION</span>
              <span className="text-purple-400 font-bold">
                {currentTime > 0 ? `${Math.round(((currentTime - (readyProcs.length === 0 && !runningProc ? 1 : 0)) / Math.max(1, currentTime)) * 100)}%` : '100%'}
              </span>
            </div>
          </div>
        </div>

        {/* Stage 3: Terminated / Completed Processes Exit Bay (Right) */}
        <div className="lg:col-span-3 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Exit / Terminated
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
              {completedProcs.length} done
            </span>
          </div>

          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {completedProcs.length === 0 ? (
              <div className="text-center py-6 text-xs text-[var(--text-muted)] italic font-mono">
                No completed processes yet
              </div>
            ) : (
              completedProcs.map((proc) => (
                <div
                  key={proc.id}
                  className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-emerald-500/20 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="font-bold text-[var(--text-primary)] truncate">{proc.name}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.2 rounded bg-emerald-500/10">
                    DONE
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="text-[10px] text-[var(--text-muted)] font-mono text-center pt-1 border-t border-[var(--glass-border)]">
            Completion Rate: {completedProcs.length}/{processes.length} ({Math.round((completedProcs.length / Math.max(1, processes.length)) * 100)}%)
          </div>
        </div>
      </div>
    </div>
  );
};
