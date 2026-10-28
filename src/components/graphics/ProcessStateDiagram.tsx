import React from 'react';
import { ProcessState, SimulatedProcess } from '../views/ProcessManagementView';
import { ArrowRight, Play, Pause, RotateCcw, CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';

interface ProcessStateDiagramProps {
  processes: SimulatedProcess[];
  selectedProcess: SimulatedProcess | null;
  onSelectProcess: (pid: number) => void;
  onAdmit: (pid: number) => void;
  onDispatch: (pid: number) => void;
  onInterrupt: (pid: number) => void;
  onWaitIO: (pid: number) => void;
  onCompleteIO: (pid: number) => void;
  onTerminate: (pid: number) => void;
}

export const ProcessStateDiagram: React.FC<ProcessStateDiagramProps> = ({
  processes,
  selectedProcess,
  onSelectProcess,
  onAdmit,
  onDispatch,
  onInterrupt,
  onWaitIO,
  onCompleteIO,
  onTerminate,
}) => {
  const getProcsInState = (state: ProcessState) => processes.filter((p) => p.state === state);

  const selectedPid = selectedProcess?.pid;
  const selectedState = selectedProcess?.state;

  return (
    <div className="glass-panel-elevated rounded-2xl p-5 border border-[var(--glass-border)] space-y-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Interactive 5-State Transition Model</h2>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Graphical Finite State Machine (FSM) showing OS scheduler lifecycle transitions
            </p>
          </div>
        </div>
        {selectedProcess && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[var(--text-secondary)]">Inspecting:</span>
            <span className="font-bold px-2 py-0.5 rounded-md border text-[var(--text-primary)]" style={{ borderColor: selectedProcess.color }}>
              PID {selectedProcess.pid} ({selectedProcess.state})
            </span>
          </div>
        )}
      </div>

      {/* 5-State Graphical Canvas Map */}
      <div className="relative w-full rounded-2xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] p-4 sm:p-6 overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#4F80FF_1px,transparent_1px)] [background-size:20px_20px]" />

        {/* State Nodes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative z-10 items-start">
          {/* 1. NEW */}
          <div className={`p-4 rounded-xl border text-center transition-all ${
            selectedState === 'NEW'
              ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/50'
              : 'bg-[var(--bg-secondary)] border-[var(--glass-border)]'
          }`}>
            <div className="text-[10px] font-mono font-bold uppercase text-amber-400 mb-1">State #1</div>
            <div className="text-sm font-extrabold text-[var(--text-primary)] mb-2">NEW</div>
            <div className="text-[11px] text-[var(--text-secondary)] mb-3">Created in memory</div>
            
            <div className="space-y-1 mb-3 min-h-[48px]">
              {getProcsInState('NEW').map((p) => (
                <button
                  key={p.pid}
                  onClick={() => onSelectProcess(p.pid)}
                  className={`w-full py-1 px-1.5 rounded text-[10px] font-mono flex items-center justify-between border cursor-pointer ${
                    selectedPid === p.pid ? 'border-white font-bold text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'
                  }`}
                  style={{ backgroundColor: `${p.color}30` }}
                >
                  <span className="truncate">P{p.pid}</span>
                  <span className="text-[9px] opacity-70">{p.burstTime}t</span>
                </button>
              ))}
            </div>

            {selectedProcess?.state === 'NEW' && (
              <button
                onClick={() => onAdmit(selectedProcess.pid)}
                className="w-full py-1.5 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition shadow-sm"
              >
                admit() →
              </button>
            )}
          </div>

          {/* 2. READY */}
          <div className={`p-4 rounded-xl border text-center transition-all ${
            selectedState === 'READY'
              ? 'bg-indigo-500/20 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-400/50'
              : 'bg-[var(--bg-secondary)] border-[var(--glass-border)]'
          }`}>
            <div className="text-[10px] font-mono font-bold uppercase text-indigo-400 mb-1">State #2</div>
            <div className="text-sm font-extrabold text-[var(--text-primary)] mb-2">READY</div>
            <div className="text-[11px] text-[var(--text-secondary)] mb-3">In Ready Queue</div>

            <div className="space-y-1 mb-3 min-h-[48px]">
              {getProcsInState('READY').map((p) => (
                <button
                  key={p.pid}
                  onClick={() => onSelectProcess(p.pid)}
                  className={`w-full py-1 px-1.5 rounded text-[10px] font-mono flex items-center justify-between border cursor-pointer ${
                    selectedPid === p.pid ? 'border-white font-bold text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'
                  }`}
                  style={{ backgroundColor: `${p.color}30` }}
                >
                  <span className="truncate">P{p.pid}</span>
                  <span className="text-[9px] opacity-70">{p.remainingTime}t left</span>
                </button>
              ))}
            </div>

            {selectedProcess?.state === 'READY' && (
              <button
                onClick={() => onDispatch(selectedProcess.pid)}
                className="w-full py-1.5 px-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition shadow-sm"
              >
                dispatch() →
              </button>
            )}
          </div>

          {/* 3. RUNNING */}
          <div className={`p-4 rounded-xl border text-center transition-all ${
            selectedState === 'RUNNING'
              ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/50'
              : 'bg-[var(--bg-secondary)] border-[var(--glass-border)]'
          }`}>
            <div className="text-[10px] font-mono font-bold uppercase text-emerald-400 mb-1">State #3</div>
            <div className="text-sm font-extrabold text-[var(--text-primary)] mb-2">RUNNING</div>
            <div className="text-[11px] text-[var(--text-secondary)] mb-3">On CPU Core</div>

            <div className="space-y-1 mb-3 min-h-[48px]">
              {getProcsInState('RUNNING').map((p) => (
                <button
                  key={p.pid}
                  onClick={() => onSelectProcess(p.pid)}
                  className={`w-full py-1 px-1.5 rounded text-[10px] font-mono flex items-center justify-between border cursor-pointer ${
                    selectedPid === p.pid ? 'border-white font-bold text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'
                  }`}
                  style={{ backgroundColor: `${p.color}30` }}
                >
                  <span className="truncate font-bold">P{p.pid}</span>
                  <span className="text-[9px] text-emerald-400 font-bold animate-pulse">ACTIVE</span>
                </button>
              ))}
            </div>

            {selectedProcess?.state === 'RUNNING' && (
              <div className="space-y-1">
                <button
                  onClick={() => onInterrupt(selectedProcess.pid)}
                  className="w-full py-1 px-1.5 rounded bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 text-[10px] font-bold"
                >
                  interrupt()
                </button>
                <button
                  onClick={() => onWaitIO(selectedProcess.pid)}
                  className="w-full py-1 px-1.5 rounded bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-[10px] font-bold"
                >
                  wait(I/O)
                </button>
                <button
                  onClick={() => onTerminate(selectedProcess.pid)}
                  className="w-full py-1 px-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[10px] font-bold"
                >
                  exit()
                </button>
              </div>
            )}
          </div>

          {/* 4. WAITING */}
          <div className={`p-4 rounded-xl border text-center transition-all ${
            selectedState === 'WAITING'
              ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20 ring-2 ring-purple-400/50'
              : 'bg-[var(--bg-secondary)] border-[var(--glass-border)]'
          }`}>
            <div className="text-[10px] font-mono font-bold uppercase text-purple-400 mb-1">State #4</div>
            <div className="text-sm font-extrabold text-[var(--text-primary)] mb-2">WAITING</div>
            <div className="text-[11px] text-[var(--text-secondary)] mb-3">Blocked on I/O</div>

            <div className="space-y-1 mb-3 min-h-[48px]">
              {getProcsInState('WAITING').map((p) => (
                <button
                  key={p.pid}
                  onClick={() => onSelectProcess(p.pid)}
                  className={`w-full py-1 px-1.5 rounded text-[10px] font-mono flex items-center justify-between border cursor-pointer ${
                    selectedPid === p.pid ? 'border-white font-bold text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'
                  }`}
                  style={{ backgroundColor: `${p.color}30` }}
                >
                  <span className="truncate">P{p.pid}</span>
                  <span className="text-[9px] opacity-70">I/O Wait</span>
                </button>
              ))}
            </div>

            {selectedProcess?.state === 'WAITING' && (
              <button
                onClick={() => onCompleteIO(selectedProcess.pid)}
                className="w-full py-1.5 px-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold transition shadow-sm"
              >
                I/O Complete →
              </button>
            )}
          </div>

          {/* 5. TERMINATED */}
          <div className={`p-4 rounded-xl border text-center transition-all ${
            selectedState === 'TERMINATED'
              ? 'bg-rose-500/20 border-rose-500 shadow-lg shadow-rose-500/20 ring-2 ring-rose-400/50'
              : 'bg-[var(--bg-secondary)] border-[var(--glass-border)]'
          }`}>
            <div className="text-[10px] font-mono font-bold uppercase text-rose-400 mb-1">State #5</div>
            <div className="text-sm font-extrabold text-[var(--text-primary)] mb-2">TERMINATED</div>
            <div className="text-[11px] text-[var(--text-secondary)] mb-3">Deallocated / Exit</div>

            <div className="space-y-1 mb-3 min-h-[48px]">
              {getProcsInState('TERMINATED').map((p) => (
                <button
                  key={p.pid}
                  onClick={() => onSelectProcess(p.pid)}
                  className={`w-full py-1 px-1.5 rounded text-[10px] font-mono flex items-center justify-between border cursor-pointer ${
                    selectedPid === p.pid ? 'border-white font-bold text-white' : 'border-transparent text-[var(--text-secondary)] hover:text-white'
                  }`}
                  style={{ backgroundColor: `${p.color}30` }}
                >
                  <span className="truncate">P{p.pid}</span>
                  <span className="text-[9px] text-rose-400 font-bold">EXIT</span>
                </button>
              ))}
            </div>

            <div className="text-[10px] font-mono text-[var(--text-muted)] italic">
              Resources Freed
            </div>
          </div>
        </div>

        {/* Transition Arrows Summary Banner */}
        <div className="mt-4 pt-3 border-t border-[var(--glass-border)] flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-[var(--text-secondary)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            NEW → READY (admit)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            READY → RUNNING (scheduler dispatch)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            RUNNING → READY (timer interrupt)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            RUNNING → WAITING (I/O event)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            RUNNING → TERMINATED (exit)
          </span>
        </div>
      </div>
    </div>
  );
};
