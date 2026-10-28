import React, { useState, useEffect, useRef } from 'react';
import { 
  ProcessInput, 
  CPUSchedulingAlgorithm, 
  CPUSimulationResult 
} from '../../engine/cpu/types';
import { runCPUScheduler, DEFAULT_PROCESS_COLORS } from '../../engine/cpu/scheduler';
import { ControlBar } from '../common/ControlBar';
import { MetricCard } from '../common/MetricCard';
import { LogViewer } from '../common/LogViewer';
import { CpuCoreGraphic } from '../graphics/CpuCoreGraphic';
import { Plus, Trash2, Cpu, Clock, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

const INITIAL_PROCESSES: ProcessInput[] = [
  { id: 'P1', name: 'P1 (Compiler)', arrivalTime: 0, burstTime: 8, priority: 2, color: '#4F80FF' },
  { id: 'P2', name: 'P2 (Web Server)', arrivalTime: 1, burstTime: 4, priority: 1, color: '#10B981' },
  { id: 'P3', name: 'P3 (Video Encoder)', arrivalTime: 2, burstTime: 9, priority: 3, color: '#8B5CF6' },
  { id: 'P4', name: 'P4 (Database Query)', arrivalTime: 3, burstTime: 5, priority: 2, color: '#EC4899' },
];

export const CpuSchedulingView: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessInput[]>(INITIAL_PROCESSES);
  const [algorithm, setAlgorithm] = useState<CPUSchedulingAlgorithm>('ROUND_ROBIN');
  const [timeQuantum, setTimeQuantum] = useState<number>(2);
  const [priorityOrder, setPriorityOrder] = useState<'LOWEST_FIRST' | 'HIGHEST_FIRST'>('LOWEST_FIRST');

  // Simulation state
  const [result, setResult] = useState<CPUSimulationResult | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  // Run simulation on parameters change
  useEffect(() => {
    try {
      setError(null);
      const res = runCPUScheduler({
        algorithm,
        processes,
        timeQuantum,
        priorityOrder
      });
      setResult(res);
      setCurrentStep(0);
      setIsPlaying(false);
    } catch (err: any) {
      setError(err.message || 'Validation error');
    }
  }, [processes, algorithm, timeQuantum, priorityOrder]);

  // Handle Playback Loop
  useEffect(() => {
    if (isPlaying && result) {
      const intervalMs = Math.max(100, 1000 / playbackSpeed);
      timerRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < result.snapshots.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, result]);

  const handleAddProcess = () => {
    const nextNum = processes.length + 1;
    const newProc: ProcessInput = {
      id: `P${nextNum}`,
      name: `P${nextNum}`,
      arrivalTime: Math.max(0, processes.length),
      burstTime: 4,
      priority: 2,
      color: DEFAULT_PROCESS_COLORS[(nextNum - 1) % DEFAULT_PROCESS_COLORS.length]
    };
    setProcesses([...processes, newProc]);
  };

  const handleDeleteProcess = (id: string) => {
    if (processes.length <= 1) {
      setError('At least one process must remain.');
      return;
    }
    setProcesses(processes.filter((p) => p.id !== id));
  };

  const handleUpdateProcess = (index: number, field: keyof ProcessInput, val: any) => {
    const updated = [...processes];
    updated[index] = { ...updated[index], [field]: val };
    setProcesses(updated);
  };

  const handleResetToPresets = () => {
    setProcesses(INITIAL_PROCESSES);
    setAlgorithm('ROUND_ROBIN');
    setTimeQuantum(2);
  };

  const currentSnapshot = result && result.snapshots[currentStep] ? result.snapshots[currentStep] : null;
  const activeGantt = currentSnapshot ? currentSnapshot.ganttBlocks : (result ? result.ganttChart : []);
  const maxTime = result ? result.totalTime : 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header and Algorithm Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-5 border border-[var(--glass-border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#4F80FF] uppercase mb-1 font-bold">
            <Cpu className="w-4 h-4 text-[#4F80FF]" />
            <span>Processor Management Simulator</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">CPU Scheduling Laboratory</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Reversible cycle execution with deterministic ties, context tracking, and exact metrics.
          </p>
        </div>

        {/* Algorithm Dropdown / Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-black/30 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          {(['FCFS', 'SJF', 'SRTF', 'PRIORITY_NON_PREEMPTIVE', 'PRIORITY_PREEMPTIVE', 'ROUND_ROBIN'] as CPUSchedulingAlgorithm[]).map((algo) => (
            <button
              key={algo}
              onClick={() => setAlgorithm(algo)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                algorithm === algo
                  ? 'aurora-btn-primary font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-200 dark:hover:bg-white/5'
              }`}
            >
              {algo.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-300 text-xs font-mono flex items-center gap-2">
          <span className="font-bold">Execution Warning:</span> {error}
        </div>
      )}

      {/* Inputs and Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Process Table Editor */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-[var(--glass-border)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--text-primary)]">Workload Process Table</span>
              <span className="text-xs text-[var(--text-muted)] font-mono">({processes.length} processes)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddProcess}
                className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-600 dark:text-[#4F80FF] hover:text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Process</span>
              </button>
              <button
                onClick={handleResetToPresets}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs transition cursor-pointer"
                title="Reset to default reference workload"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-[var(--text-muted)] text-[11px] uppercase">
                  <th className="pb-2 font-semibold">PID / Color</th>
                  <th className="pb-2 font-semibold">Process Name</th>
                  <th className="pb-2 font-semibold">Arrival (AT)</th>
                  <th className="pb-2 font-semibold">Burst (BT)</th>
                  <th className="pb-2 font-semibold">Priority</th>
                  <th className="pb-2 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                {processes.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-100/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full shadow-sm ring-1 ring-white/20" style={{ backgroundColor: p.color }} />
                      <span className="font-bold text-[var(--text-primary)]">{p.id}</span>
                    </td>
                    <td className="py-2.5">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => handleUpdateProcess(idx, 'name', e.target.value)}
                        className="bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-[var(--text-primary)] w-28 text-xs focus:border-[#4F80FF] outline-none"
                      />
                    </td>
                    <td className="py-2.5">
                      <input
                        type="number"
                        min="0"
                        value={p.arrivalTime}
                        onChange={(e) => handleUpdateProcess(idx, 'arrivalTime', Math.max(0, parseInt(e.target.value) || 0))}
                        className="bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-[var(--text-primary)] w-16 text-xs focus:border-[#4F80FF] outline-none"
                      />
                    </td>
                    <td className="py-2.5">
                      <input
                        type="number"
                        min="1"
                        value={p.burstTime}
                        onChange={(e) => handleUpdateProcess(idx, 'burstTime', Math.max(1, parseInt(e.target.value) || 1))}
                        className="bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-[var(--text-primary)] w-16 text-xs focus:border-[#4F80FF] outline-none"
                      />
                    </td>
                    <td className="py-2.5">
                      <input
                        type="number"
                        min="1"
                        value={p.priority}
                        onChange={(e) => handleUpdateProcess(idx, 'priority', parseInt(e.target.value) || 1)}
                        className="bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-[var(--text-primary)] w-16 text-xs focus:border-[#4F80FF] outline-none"
                      />
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleDeleteProcess(p.id)}
                        className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-500 hover:text-rose-600 dark:hover:text-rose-300 transition cursor-pointer"
                        title="Delete process"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Algorithm Specific Settings & Live CPU Core */}
        <div className="glass-panel rounded-2xl p-5 border border-[var(--glass-border)] space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Scheduling Parameters</h2>

            {algorithm === 'ROUND_ROBIN' && (
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)] font-medium">Time Quantum (q)</span>
                  <span className="font-mono text-[#2DD4BF] font-bold">{timeQuantum} ticks</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={timeQuantum}
                  onChange={(e) => setTimeQuantum(parseInt(e.target.value) || 1)}
                  className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#2DD4BF]"
                />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
                  <span>1 tick</span>
                  <span>5 ticks</span>
                  <span>10 ticks</span>
                </div>
              </div>
            )}

            {(algorithm === 'PRIORITY_NON_PREEMPTIVE' || algorithm === 'PRIORITY_PREEMPTIVE') && (
              <div className="space-y-2 p-3 rounded-xl bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs">
                <span className="text-[var(--text-secondary)] font-medium block">Priority Convention</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPriorityOrder('LOWEST_FIRST')}
                    className={`flex-1 py-1.5 rounded-lg font-mono text-[11px] transition cursor-pointer ${
                      priorityOrder === 'LOWEST_FIRST'
                        ? 'bg-[#4F80FF] text-white font-bold shadow-sm'
                        : 'bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    1 = Highest
                  </button>
                  <button
                    onClick={() => setPriorityOrder('HIGHEST_FIRST')}
                    className={`flex-1 py-1.5 rounded-lg font-mono text-[11px] transition cursor-pointer ${
                      priorityOrder === 'HIGHEST_FIRST'
                        ? 'bg-[#4F80FF] text-white font-bold shadow-sm'
                        : 'bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Max = Highest
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Simulated Active Core Status */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[var(--text-muted)] font-mono uppercase tracking-wider text-[10px] font-bold">Active CPU Core #0</span>
              <span className="text-[#10B981] flex items-center gap-1 font-mono text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span>Running</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4F80FF]/20 to-[#2DD4BF]/20 border border-[#4F80FF]/30 flex items-center justify-center font-bold text-base font-mono text-[var(--text-primary)] shadow-sm">
                {currentSnapshot?.runningProcessId ? currentSnapshot.runningProcessId : 'IDLE'}
              </div>
              <div className="text-xs space-y-0.5">
                <div className="text-[var(--text-primary)] font-bold">
                  {currentSnapshot?.runningProcessId
                    ? `Executing: ${currentSnapshot.runningProcessId}`
                    : 'CPU Core Idle'}
                </div>
                <div className="text-[var(--text-muted)] text-[11px] font-mono">
                  Clock: t={currentSnapshot?.currentTime ?? 0} ticks
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <ControlBar
        currentStep={currentStep}
        totalSteps={result ? result.snapshots.length - 1 : 0}
        isPlaying={isPlaying}
        speed={playbackSpeed}
        canStepBack={currentStep > 0}
        canStepForward={result ? currentStep < result.snapshots.length - 1 : false}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onStepBack={() => {
          setIsPlaying(false);
          setCurrentStep((prev) => Math.max(0, prev - 1));
        }}
        onStepForward={() => {
          setIsPlaying(false);
          if (result && currentStep < result.snapshots.length - 1) {
            setCurrentStep((prev) => prev + 1);
          }
        }}
        onReset={() => {
          setIsPlaying(false);
          setCurrentStep(0);
        }}
        onSpeedChange={(s) => setPlaybackSpeed(s)}
        onScrub={(s) => {
          setIsPlaying(false);
          setCurrentStep(s);
        }}
        statusLabel={currentSnapshot?.log}
      />

      {/* Interactive Hardware CPU Core Architecture Graphic */}
      <CpuCoreGraphic
        snapshot={currentSnapshot}
        processes={processes}
        currentTime={currentSnapshot?.currentTime ?? 0}
        totalTime={maxTime}
      />

      {/* Graphical Gantt Chart Visualization */}
      <div className="glass-panel-elevated rounded-2xl p-5 border border-[var(--glass-border)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2DD4BF]" />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Animated Execution Gantt Chart</h2>
          </div>
          <div className="text-xs text-[var(--text-muted)] font-mono">
            Interval: [0 — {maxTime}] ticks
          </div>
        </div>

        {/* Gantt SVG / Flex Bar */}
        <div className="relative pt-2 pb-6">
          <div className="w-full h-14 bg-slate-100 dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/10 flex overflow-hidden p-1 gap-1 relative shadow-inner">
            {activeGantt.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-muted)] font-mono">
                Press Play or Step to begin CPU execution
              </div>
            ) : (
              activeGantt.map((block, idx) => {
                const widthPercent = maxTime > 0 ? ((block.endTime - block.startTime) / maxTime) * 100 : 0;
                const isCurrent = idx === activeGantt.length - 1;

                return (
                  <div
                    key={idx}
                    style={{
                      width: `${Math.max(2, widthPercent)}%`,
                      backgroundColor: block.color
                    }}
                    className={`h-full rounded-lg flex flex-col items-center justify-center text-white relative transition-all duration-300 group shadow-sm ${
                      isCurrent ? 'ring-2 ring-white shadow-[0_0_15px_rgba(255,255,255,0.4)] z-10 scale-[1.02]' : 'opacity-90 hover:opacity-100'
                    }`}
                    title={`${block.processName} [${block.startTime} -> ${block.endTime}]`}
                  >
                    <span className="font-extrabold font-mono text-[11px] truncate px-1 drop-shadow-sm">
                      {block.processId}
                    </span>
                    <span className="text-[9px] font-mono opacity-85 font-semibold">
                      {block.endTime - block.startTime}t
                    </span>

                    {/* Time marker below */}
                    <span className="absolute -bottom-5 left-0 font-mono text-[10px] text-[var(--text-muted)] transform -translate-x-1/2 font-semibold">
                      {block.startTime}
                    </span>
                    {idx === activeGantt.length - 1 && (
                      <span className="absolute -bottom-5 right-0 font-mono text-[10px] text-[var(--text-muted)] transform translate-x-1/2 font-semibold">
                        {block.endTime}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ready Queue & Completed Process Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Ready Queue */}
          <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-black/30 border border-slate-200 dark:border-white/10">
            <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center justify-between">
              <span>Ready Queue (Waiting for CPU)</span>
              <span className="text-[11px] font-mono text-[#4F80FF] font-bold">
                {currentSnapshot?.readyQueue.length || 0} in queue
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto min-h-[40px]">
              {currentSnapshot?.readyQueue.length === 0 ? (
                <span className="text-xs text-[var(--text-muted)] italic font-mono">Queue empty</span>
              ) : (
                currentSnapshot?.readyQueue.map((pid) => {
                  const proc = processes.find((p) => p.id === pid);
                  return (
                    <div
                      key={pid}
                      className="px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm shrink-0"
                      style={{ 
                        backgroundColor: `${proc?.color || '#4F80FF'}22`, 
                        borderColor: `${proc?.color || '#4F80FF'}55`,
                        color: proc?.color || '#fff' 
                      }}
                    >
                      <span>{pid}</span>
                      <span className="text-[10px] opacity-75">({currentSnapshot.remainingBurstTimes[pid]}t)</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Completed Processes */}
          <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-black/30 border border-slate-200 dark:border-white/10">
            <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center justify-between">
              <span>Completed Processes</span>
              <span className="text-[11px] font-mono text-[#10B981] font-bold">
                {currentSnapshot?.completedProcessIds.length || 0} / {processes.length}
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto min-h-[40px]">
              {currentSnapshot?.completedProcessIds.length === 0 ? (
                <span className="text-xs text-[var(--text-muted)] italic font-mono">None completed yet</span>
              ) : (
                currentSnapshot?.completedProcessIds.map((pid) => (
                  <div
                    key={pid}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs font-mono font-bold flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                    <span>{pid}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calculated Metrics Readout */}
      {result && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#906DF7]" />
            <span>Algorithmic Execution Metrics & Performance</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard
              label="Avg Turnaround"
              value={result.averageTurnaroundTime}
              unit="ticks"
              subtext="TAT = CT - AT"
              color="blue"
            />
            <MetricCard
              label="Avg Waiting"
              value={result.averageWaitingTime}
              unit="ticks"
              subtext="WT = TAT - BT"
              color="cyan"
            />
            <MetricCard
              label="Avg Response"
              value={result.averageResponseTime}
              unit="ticks"
              subtext="First RT - AT"
              color="violet"
            />
            <MetricCard
              label="CPU Utilization"
              value={result.cpuUtilization}
              unit="%"
              subtext="Busy / Total"
              color="emerald"
            />
            <MetricCard
              label="Throughput"
              value={result.throughput}
              unit="proc/t"
              subtext="Completed / Time"
              color="amber"
            />
            <MetricCard
              label="Context Switches"
              value={result.totalContextSwitches}
              unit="switches"
              subtext="Process transfers"
              color="rose"
            />
          </div>

          {/* Detailed Calculations Table */}
          <div className="glass-panel rounded-2xl p-5 border border-[var(--glass-border)] overflow-x-auto">
            <div className="text-xs font-bold text-[var(--text-primary)] mb-3">Individual Process Breakdown</div>
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-[var(--text-muted)] text-[11px] uppercase">
                  <th className="pb-2 font-semibold">PID</th>
                  <th className="pb-2 font-semibold">Arrival (AT)</th>
                  <th className="pb-2 font-semibold">Burst (BT)</th>
                  <th className="pb-2 font-semibold">Completion (CT)</th>
                  <th className="pb-2 font-semibold">Turnaround (TAT)</th>
                  <th className="pb-2 font-semibold">Waiting (WT)</th>
                  <th className="pb-2 font-semibold">Response (RT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                {result.metrics.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-100/50 dark:hover:bg-white/[0.02]">
                    <td className="py-2.5 font-bold flex items-center gap-1.5" style={{ color: m.color }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                      <span>{m.id}</span>
                    </td>
                    <td className="py-2.5 text-[var(--text-secondary)]">{m.arrivalTime}</td>
                    <td className="py-2.5 text-[var(--text-secondary)]">{m.burstTime}</td>
                    <td className="py-2.5 text-[var(--text-primary)] font-bold">{m.completionTime}</td>
                    <td className="py-2.5 text-[#4F80FF] font-semibold">{m.turnaroundTime}</td>
                    <td className="py-2.5 text-[#2DD4BF] font-semibold">{m.waitingTime}</td>
                    <td className="py-2.5 text-[#906DF7] font-semibold">{m.responseTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Execution Event Log */}
      {result && <LogViewer logs={result.logs} activeStep={currentStep} />}
    </div>
  );
};
