import React, { useState, useEffect, useRef } from 'react';
import { 
  MemoryAlgorithm, 
  MemoryRequest, 
  MemorySimulationResult 
} from '../../engine/memory/types';
import { runMemoryAllocator } from '../../engine/memory/allocator';
import { ControlBar } from '../common/ControlBar';
import { MetricCard } from '../common/MetricCard';
import { LogViewer } from '../common/LogViewer';
import { MemoryVisualizerGraphic } from '../graphics/MemoryVisualizerGraphic';
import { Layers, Plus, Trash2, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

const INITIAL_REQUESTS: MemoryRequest[] = [
  { id: 'r1', processId: 'P1', size: 180, action: 'ALLOCATE' },
  { id: 'r2', processId: 'P2', size: 300, action: 'ALLOCATE' },
  { id: 'r3', processId: 'P3', size: 120, action: 'ALLOCATE' },
  { id: 'r4', processId: 'P1', size: 180, action: 'DEALLOCATE' },
  { id: 'r5', processId: 'P4', size: 140, action: 'ALLOCATE' },
  { id: 'r6', processId: 'P5', size: 210, action: 'ALLOCATE' }
];

export const MemoryAllocationView: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<MemoryAlgorithm>('FIRST_FIT');
  const [totalMemory, setTotalMemory] = useState<number>(1024);
  const [requests, setRequests] = useState<MemoryRequest[]>(INITIAL_REQUESTS);
  const [buddyMinSize, setBuddyMinSize] = useState<number>(32);

  // Simulation execution
  const [result, setResult] = useState<MemorySimulationResult | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      setError(null);
      const res = runMemoryAllocator({
        algorithm,
        totalMemory,
        requests,
        buddyMinBlockSize: buddyMinSize
      });
      setResult(res);
      setCurrentStep(0);
      setIsPlaying(false);
    } catch (err: any) {
      setError(err.message || 'Memory allocation error');
    }
  }, [algorithm, totalMemory, requests, buddyMinSize]);

  useEffect(() => {
    if (isPlaying && result) {
      const intervalMs = Math.max(150, 1200 / playbackSpeed);
      timerRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < result.snapshots.length) {
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

  const activeSnapshot = result && currentStep > 0 && result.snapshots[currentStep - 1] 
    ? result.snapshots[currentStep - 1] 
    : null;

  const currentBlocks = activeSnapshot 
    ? activeSnapshot.blocks 
    : (result ? result.initialBlocks : []);

  const currentMetrics = activeSnapshot 
    ? activeSnapshot.metrics 
    : (result ? result.finalMetrics : {
        totalMemory,
        allocatedMemory: 0,
        freeMemory: totalMemory,
        internalFragmentation: 0,
        externalFragmentation: 0,
        largestFreeBlock: totalMemory,
        utilizationPercentage: 0,
        successfulAllocations: 0,
        failedAllocations: 0
      });

  const handleAddRequest = () => {
    const nextProcId = `P${requests.length + 1}`;
    setRequests([...requests, {
      id: `r-${Date.now()}`,
      processId: nextProcId,
      size: 150,
      action: 'ALLOCATE'
    }]);
  };

  const handleDeleteRequest = (index: number) => {
    if (requests.length <= 1) return;
    setRequests(requests.filter((_, i) => i !== index));
  };

  const handleUpdateRequest = (index: number, field: keyof MemoryRequest, val: any) => {
    const updated = [...requests];
    updated[index] = { ...updated[index], [field]: val };
    setRequests(updated);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header & Algorithm Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-5 border border-[var(--glass-border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#906DF7] uppercase mb-1 font-bold">
            <Layers className="w-4 h-4 text-[#906DF7]" />
            <span>Memory Subsystem Simulator</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">Memory Allocation Laboratory</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Contiguous dynamic partitioning, fragmentation analysis, and buddy-system binary power-of-two coalescing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-black/30 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          {(['FIRST_FIT', 'BEST_FIT', 'WORST_FIT', 'FIXED_PARTITIONING', 'BUDDY_SYSTEM'] as MemoryAlgorithm[]).map((algo) => (
            <button
              key={algo}
              onClick={() => setAlgorithm(algo)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                algorithm === algo
                  ? 'bg-gradient-to-r from-[#906DF7] to-[#4F80FF] text-white font-bold shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-200 dark:hover:bg-white/5'
              }`}
            >
              {algo.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-300 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Control Bar */}
      <ControlBar
        currentStep={currentStep}
        totalSteps={result ? result.snapshots.length : 0}
        isPlaying={isPlaying}
        speed={playbackSpeed}
        canStepBack={currentStep > 0}
        canStepForward={result ? currentStep < result.snapshots.length : false}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onStepBack={() => {
          setIsPlaying(false);
          setCurrentStep((prev) => Math.max(0, prev - 1));
        }}
        onStepForward={() => {
          setIsPlaying(false);
          if (result && currentStep < result.snapshots.length) {
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
        statusLabel={activeSnapshot?.log || 'Initial clean memory state.'}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Total Memory"
          value={totalMemory}
          unit="KB"
          subtext="Configured physical RAM"
          color="blue"
        />
        <MetricCard
          label="Allocated"
          value={currentMetrics.allocatedMemory}
          unit="KB"
          subtext="Occupied by processes"
          color="cyan"
        />
        <MetricCard
          label="Free Space"
          value={currentMetrics.freeMemory}
          unit="KB"
          subtext="Available memory pool"
          color="emerald"
        />
        <MetricCard
          label="External Frag"
          value={currentMetrics.externalFragmentation}
          unit="KB"
          subtext="Free but un-coalesced"
          color="amber"
        />
        <MetricCard
          label="Internal Frag"
          value={currentMetrics.internalFragmentation}
          unit="KB"
          subtext="Wasted inside blocks"
          color="rose"
        />
        <MetricCard
          label="Utilization"
          value={currentMetrics.utilizationPercentage}
          unit="%"
          subtext="Allocated / Total"
          color="violet"
        />
      </div>

      {/* Interactive Physical RAM Silicon Bar Graphic */}
      <MemoryVisualizerGraphic
        algorithm={algorithm}
        totalMemory={totalMemory}
        blocks={currentBlocks}
        isBuddyMode={algorithm === 'BUDDY_SYSTEM'}
      />

      {/* Memory Map & Request Sequence Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Request List Editor */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-[var(--glass-border)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Allocation / Deallocation Queue</h2>
              <span className="text-[11px] text-[var(--text-muted)] font-mono">Step sequence ({requests.length} operations)</span>
            </div>
            <button
              onClick={handleAddRequest}
              className="px-2.5 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 dark:text-[#906DF7] hover:text-[var(--text-primary)] border border-purple-500/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Request</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {requests.map((req, idx) => {
              const isCurrent = currentStep === idx + 1;
              const isPassed = currentStep > idx + 1;
              return (
                <div
                  key={req.id || idx}
                  className={`p-3 rounded-xl border text-xs font-mono transition-all flex items-center justify-between gap-2 ${
                    isCurrent
                      ? 'bg-purple-500/20 border-[#906DF7] shadow-md font-semibold'
                      : isPassed
                      ? 'bg-slate-100/40 dark:bg-black/20 border-slate-200 dark:border-white/5 opacity-60'
                      : 'bg-slate-100/70 dark:bg-black/30 border-slate-200 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-muted)] w-5 font-bold">#{idx + 1}</span>
                    <select
                      value={req.action}
                      onChange={(e) => handleUpdateRequest(idx, 'action', e.target.value)}
                      className="bg-slate-200/80 dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-lg px-2 py-1 text-[var(--text-primary)] text-[11px] focus:outline-none"
                    >
                      <option value="ALLOCATE">ALLOCATE</option>
                      <option value="DEALLOCATE">DEALLOCATE</option>
                    </select>
                    <input
                      type="text"
                      value={req.processId}
                      onChange={(e) => handleUpdateRequest(idx, 'processId', e.target.value)}
                      className="bg-slate-200/80 dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-lg px-2 py-1 text-[var(--text-primary)] w-14 text-[11px] focus:outline-none font-bold"
                      placeholder="PID"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {req.action === 'ALLOCATE' && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="10"
                          value={req.size}
                          onChange={(e) => handleUpdateRequest(idx, 'size', parseInt(e.target.value) || 10)}
                          className="bg-slate-200/80 dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-lg px-2 py-1 text-[var(--text-primary)] w-16 text-[11px] focus:outline-none font-bold"
                        />
                        <span className="text-[var(--text-muted)] text-[10px]">KB</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteRequest(idx)}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-500 hover:text-rose-600 dark:hover:text-rose-300 transition cursor-pointer"
                      title="Remove request"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Graphical Vertical Memory Map */}
        <div className="lg:col-span-7 glass-panel-elevated rounded-2xl p-5 border border-[var(--glass-border)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2DD4BF]" />
              <span>Graphical Physical Memory Map (Vertical Layout)</span>
            </h2>
            <div className="text-[11px] font-mono text-[var(--text-muted)]">
              {currentBlocks.length} memory block(s)
            </div>
          </div>

          {/* Memory Ladder */}
          <div className="space-y-2 pt-2 max-h-[460px] overflow-y-auto pr-1">
            {currentBlocks.map((b, idx) => {
              const heightPixels = Math.max(50, Math.min(160, Math.round((b.size / totalMemory) * 400)));
              return (
                <div
                  key={b.id || idx}
                  style={{ height: `${heightPixels}px` }}
                  className={`rounded-2xl border p-3 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group shadow-sm ${
                    b.isAllocated
                      ? 'border-white/20 shadow-md ring-1 ring-white/10'
                      : 'bg-emerald-500/[0.04] border-dashed border-emerald-500/30 hover:bg-emerald-500/[0.08]'
                  }`}
                >
                  {/* Background process color tint if allocated */}
                  {b.isAllocated && (
                    <div
                      className="absolute inset-0 opacity-25 pointer-events-none"
                      style={{ backgroundColor: b.color || '#4F80FF' }}
                    />
                  )}

                  <div className="flex items-center justify-between relative z-10 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-muted)] text-[10px] font-bold">0x{b.startAddress.toString(16).padStart(4, '0')}</span>
                      {b.isAllocated ? (
                        <span className="font-extrabold text-[var(--text-primary)] px-2.5 py-0.5 rounded-lg bg-black/40 border border-white/10 shadow-sm">
                          {b.processId}
                        </span>
                      ) : (
                        <span className="text-emerald-500 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px]">
                          FREE BLOCK
                        </span>
                      )}
                    </div>
                    <span className="text-[var(--text-primary)] font-extrabold text-sm">{b.size} KB</span>
                  </div>

                  <div className="flex items-center justify-between relative z-10 text-[11px] font-mono text-[var(--text-secondary)]">
                    <span>Range: [{b.startAddress} — {b.startAddress + b.size} KB]</span>
                    {b.internalFragmentation ? (
                      <span className="text-rose-500 dark:text-rose-400 font-bold">
                        Internal Frag: {b.internalFragmentation} KB
                      </span>
                    ) : (
                      <span>{b.isAllocated ? 'Zero Internal Frag' : 'Available for allocation'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Log Output */}
      {result && <LogViewer logs={result.logs} activeStep={currentStep} />}
    </div>
  );
};
