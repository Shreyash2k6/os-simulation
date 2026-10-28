import React, { useState, useEffect, useRef } from 'react';
import { 
  PagingAlgorithm, 
  PagingSimulationResult 
} from '../../engine/paging/types';
import { runPageReplacement, translateAddress } from '../../engine/paging/pager';
import { ControlBar } from '../common/ControlBar';
import { MetricCard } from '../common/MetricCard';
import { LogViewer } from '../common/LogViewer';
import { MmuPagingGraphic } from '../graphics/MmuPagingGraphic';
import { FileText, Cpu, Calculator, CheckCircle2, AlertTriangle, Sparkles, RefreshCcw, Layers } from 'lucide-react';

const DEFAULT_REFERENCE_STRING = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];

export const PagingView: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<PagingAlgorithm>('LRU');
  const [frameCount, setFrameCount] = useState<number>(3);
  const [refStringInput, setRefStringInput] = useState<string>(DEFAULT_REFERENCE_STRING.join(', '));
  const [referenceString, setReferenceString] = useState<number[]>(DEFAULT_REFERENCE_STRING);

  // Address Translation Calculator Inputs
  const [testLogicalAddress, setTestLogicalAddress] = useState<number>(5320);
  const [testPageSize, setTestPageSize] = useState<number>(1024);

  // Simulation execution
  const [result, setResult] = useState<PagingSimulationResult | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  const handleUpdateRefString = (val: string) => {
    setRefStringInput(val);
    try {
      const parsed = val
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s) => {
          const num = parseInt(s, 10);
          if (isNaN(num) || num < 0) throw new Error('References must be non-negative integers.');
          return num;
        });

      if (parsed.length > 0) {
        setReferenceString(parsed);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid reference string.');
    }
  };

  useEffect(() => {
    try {
      setError(null);
      const res = runPageReplacement({
        algorithm,
        referenceString,
        frameCount
      });
      setResult(res);
      setCurrentStep(0);
      setIsPlaying(false);
    } catch (err: any) {
      setError(err.message || 'Paging simulation error');
    }
  }, [algorithm, referenceString, frameCount]);

  useEffect(() => {
    if (isPlaying && result) {
      const intervalMs = Math.max(100, 1000 / playbackSpeed);
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

  const currentFrames = activeSnapshot ? activeSnapshot.frames : Array(frameCount).fill(null);
  const activePageTable = activeSnapshot ? activeSnapshot.pageTable : {};

  // Compute translation for the active state
  const translation = translateAddress(testLogicalAddress, testPageSize, activePageTable);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header and Algorithm Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-5 border border-[var(--glass-border)] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-semibold tracking-wider uppercase mb-1">
            <span className="p-1 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <FileText className="w-3.5 h-3.5" />
            </span>
            <span>Virtual Memory & MMU Simulator</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Paging & Page Replacement</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Simulate physical frame slots, FIFO queue eviction, LRU reference recency, and Belady's Optimal theoretical benchmark.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[var(--bg-elevated)] p-1.5 rounded-xl border border-[var(--glass-border)]">
          {(['FIFO', 'LRU', 'OPTIMAL'] as PagingAlgorithm[]).map((algo) => (
            <button
              key={algo}
              onClick={() => setAlgorithm(algo)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                algorithm === algo
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold shadow-md shadow-purple-500/25 ring-1 ring-purple-400/40'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
              }`}
            >
              {algo === 'OPTIMAL' ? 'OPTIMAL (Belady Benchmark)' : algo}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
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
        statusLabel={activeSnapshot?.log || 'Simulation ready at step 0.'}
      />

      {/* Inputs Configuration */}
      <div className="glass-panel rounded-2xl p-5 border border-[var(--glass-border)] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            Workload Configuration
          </h2>
          <button
            onClick={() => handleUpdateRefString(DEFAULT_REFERENCE_STRING.join(', '))}
            className="text-xs text-[var(--text-muted)] hover:text-purple-400 flex items-center gap-1 font-mono transition"
          >
            <RefreshCcw className="w-3 h-3" />
            <span>Reset Reference String</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs text-[var(--text-secondary)] font-mono block">Page Reference String (Comma Separated)</label>
            <input
              type="text"
              value={refStringInput}
              onChange={(e) => handleUpdateRefString(e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-[var(--text-primary)] font-mono text-xs focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 outline-none transition"
              placeholder="e.g. 7, 0, 1, 2, 0, 3, 0, 4, 2, 3"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-secondary)] font-mono flex items-center justify-between">
              <span>Physical Frames (Slots)</span>
              <span className="text-purple-400 font-bold px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30">{frameCount} frames</span>
            </label>
            <input
              type="range"
              min="2"
              max="8"
              value={frameCount}
              onChange={(e) => setFrameCount(parseInt(e.target.value) || 3)}
              className="w-full h-2 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer accent-purple-500 mt-2"
            />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            label="Page Faults"
            value={result.metrics.pageFaults}
            unit="faults"
            subtext={`Fault Ratio: ${result.metrics.faultRatio}%`}
            color="rose"
          />
          <MetricCard
            label="Page Hits"
            value={result.metrics.pageHits}
            unit="hits"
            subtext={`Hit Ratio: ${result.metrics.hitRatio}%`}
            color="emerald"
          />
          <MetricCard
            label="Hit Ratio"
            value={result.metrics.hitRatio}
            unit="%"
            subtext="Hits / Total References"
            color="cyan"
          />
          <MetricCard
            label="Total References"
            value={result.metrics.totalReferences}
            unit="steps"
            subtext={`${frameCount} physical frames configured`}
            color="violet"
          />
        </div>
      )}

      {/* Interactive Hardware MMU Paging Graphic */}
      <MmuPagingGraphic
        algorithm={algorithm}
        logicalAddress={testLogicalAddress}
        pageSize={testPageSize}
        pageNumber={translation.pageNumber}
        offset={translation.offset}
        frameNumber={translation.frameNumber}
        physicalAddress={translation.physicalAddress}
        frames={currentFrames}
        activePage={activeSnapshot ? activeSnapshot.currentReference : null}
        isHit={activeSnapshot ? activeSnapshot.isHit : null}
      />

      {/* Reference String Tape Visualizer */}
      <div className="glass-panel-elevated rounded-2xl p-5 border border-[var(--glass-border)] space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            Reference Tape Execution Flow
          </span>
          <span className="text-xs text-[var(--text-secondary)] font-mono">
            {currentStep === 0 ? 'Ready (Step 0)' : `Executing Reference #${currentStep} of ${referenceString.length}`}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-2.5 px-1 scrollbar-thin">
          {referenceString.map((pNum, idx) => {
            const isCurrent = currentStep === idx + 1;
            const isPassed = currentStep > idx + 1;
            const stepInfo = result && result.snapshots[idx];
            const wasHit = stepInfo?.isHit;

            return (
              <div
                key={idx}
                className={`flex flex-col items-center shrink-0 transition-all duration-200 ${
                  isCurrent ? 'scale-110 z-10' : ''
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl font-mono text-sm font-bold flex items-center justify-center border transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-white shadow-lg shadow-purple-500/40 ring-2 ring-purple-400/50'
                      : isPassed
                      ? wasHit
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-sm'
                        : 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-sm'
                      : 'bg-[var(--bg-elevated)] border-[var(--glass-border)] text-[var(--text-secondary)]'
                  }`}
                >
                  {pNum}
                </div>
                <span className={`text-[10px] font-mono mt-1 ${isCurrent ? 'text-purple-400 font-bold' : 'text-[var(--text-muted)]'}`}>
                  #{idx + 1}
                </span>
                {isPassed && (
                  <span className={`text-[9px] font-mono uppercase font-bold ${wasHit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {wasHit ? 'HIT' : 'FAULT'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Physical Frame Slots & Page Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Physical Frames Grid */}
        <div className="glass-panel rounded-2xl p-5 border border-[var(--glass-border)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Physical Memory Frame Allocation</span>
            </h2>
            {activeSnapshot && (
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-sm ${
                  activeSnapshot.isHit
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-rose-500/10'
                }`}
              >
                {activeSnapshot.isHit ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PAGE HIT
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    PAGE FAULT
                  </>
                )}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {currentFrames.map((pageVal, fIdx) => {
              const isTargetFrame = activeSnapshot?.loadedPageIndex === fIdx;

              return (
                <div
                  key={fIdx}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between min-h-[130px] ${
                    isTargetFrame
                      ? activeSnapshot?.isHit
                        ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400'
                        : 'bg-rose-500/15 border-rose-500/60 shadow-lg shadow-rose-500/20 ring-1 ring-rose-400'
                      : 'bg-[var(--bg-elevated)] border-[var(--glass-border)]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--text-secondary)] font-semibold">Frame #{fIdx}</span>
                    {isTargetFrame && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/20 text-[var(--text-primary)]">
                        Accessed
                      </span>
                    )}
                  </div>

                  <div className="text-center py-2">
                    {pageVal !== null ? (
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-3xl font-extrabold font-mono text-[var(--text-primary)] tracking-tight">
                          P{pageVal}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)] italic font-mono">Empty Frame</span>
                    )}
                  </div>

                  <div className="text-[10px] text-[var(--text-secondary)] font-mono text-center">
                    {pageVal !== null ? `Holding Page ${pageVal}` : 'Available'}
                  </div>
                </div>
              );
            })}
          </div>

          {activeSnapshot?.evictedPage !== null && activeSnapshot?.evictedPage !== undefined && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center justify-between shadow-sm">
              <span className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Eviction Triggered:
              </span>
              <span>Page {activeSnapshot.evictedPage} removed from frame</span>
            </div>
          )}
        </div>

        {/* Logical-to-Physical Address Translation Calculator */}
        <div className="glass-panel-elevated rounded-2xl p-5 border border-[var(--glass-border)] space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-400" />
              <span>MMU Address Translation Engine</span>
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--glass-border)]">
              p = Addr / PageSize
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <label className="text-[var(--text-secondary)] block mb-1 font-semibold">Logical Address (bytes)</label>
              <input
                type="number"
                value={testLogicalAddress}
                onChange={(e) => setTestLogicalAddress(parseInt(e.target.value) || 0)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:border-purple-400 outline-none transition"
              />
            </div>
            <div>
              <label className="text-[var(--text-secondary)] block mb-1 font-semibold">Page Size</label>
              <select
                value={testPageSize}
                onChange={(e) => setTestPageSize(parseInt(e.target.value))}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:border-purple-400 outline-none transition"
              >
                <option value="512">512 Bytes (9 bits offset)</option>
                <option value="1024">1024 Bytes (10 bits offset)</option>
                <option value="4096">4096 Bytes (12 bits offset)</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] space-y-2.5 text-xs font-mono shadow-inner">
            <div className="flex justify-between border-b border-[var(--glass-border)] pb-2">
              <span className="text-[var(--text-secondary)]">Computed Page Number (p):</span>
              <span className="text-purple-400 font-bold text-sm">{translation.pageNumber}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--glass-border)] pb-2">
              <span className="text-[var(--text-secondary)]">Computed Offset (d):</span>
              <span className="text-cyan-400 font-bold text-sm">{translation.offset} bytes</span>
            </div>
            <div className="flex justify-between border-b border-[var(--glass-border)] pb-2">
              <span className="text-[var(--text-secondary)]">Frame in Physical Memory:</span>
              <span className={translation.frameNumber !== null ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {translation.frameNumber !== null ? `Frame ${translation.frameNumber}` : 'Page Fault (Trap to OS)'}
              </span>
            </div>
            <div className="flex justify-between pt-1 items-center">
              <span className="text-[var(--text-primary)] font-bold">Physical Address:</span>
              <span className="text-cyan-400 font-bold text-sm bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded">
                {translation.physicalAddress !== null
                  ? `${translation.physicalAddress} (0x${translation.physicalAddress.toString(16).toUpperCase()})`
                  : 'N/A (Page Fault)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Event Logs */}
      {result && <LogViewer logs={result.logs} activeStep={currentStep} />}
    </div>
  );
};
