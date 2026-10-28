import React, { useState, useEffect, useRef } from 'react';
import { 
  DiskAlgorithm, 
  DiskSimulationResult 
} from '../../engine/disk/types';
import { runDiskScheduler } from '../../engine/disk/diskScheduler';
import { ControlBar } from '../common/ControlBar';
import { MetricCard } from '../common/MetricCard';
import { LogViewer } from '../common/LogViewer';
import { DiskPlatterGraphic } from '../graphics/DiskPlatterGraphic';
import { HardDrive, Play, ArrowRight, ArrowLeft, RotateCcw, Compass, Activity, AlertTriangle } from 'lucide-react';

const DEFAULT_REQUESTS = [98, 183, 37, 122, 14, 124, 65, 67];

export const DiskSchedulingView: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<DiskAlgorithm>('LOOK');
  const [minCylinder, setMinCylinder] = useState<number>(0);
  const [maxCylinder, setMaxCylinder] = useState<number>(199);
  const [initialHead, setInitialHead] = useState<number>(53);
  const [requestsInput, setRequestsInput] = useState<string>(DEFAULT_REQUESTS.join(', '));
  const [requests, setRequests] = useState<number[]>(DEFAULT_REQUESTS);
  const [direction, setDirection] = useState<'LEFT' | 'RIGHT'>('RIGHT');

  // Simulation execution
  const [result, setResult] = useState<DiskSimulationResult | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  const handleUpdateRequests = (val: string) => {
    setRequestsInput(val);
    try {
      const parsed = val
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s) => {
          const num = parseInt(s, 10);
          if (isNaN(num)) throw new Error('Cylinders must be valid numbers.');
          return num;
        });

      if (parsed.length > 0) {
        setRequests(parsed);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid cylinder format.');
    }
  };

  useEffect(() => {
    try {
      setError(null);
      const res = runDiskScheduler({
        algorithm,
        cylinderRange: [minCylinder, maxCylinder],
        initialHead,
        requests,
        direction
      });
      setResult(res);
      setCurrentStep(0);
      setIsPlaying(false);
    } catch (err: any) {
      setError(err.message || 'Disk scheduling error');
    }
  }, [algorithm, minCylinder, maxCylinder, initialHead, requests, direction]);

  useEffect(() => {
    if (isPlaying && result) {
      const intervalMs = Math.max(120, 1100 / playbackSpeed);
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

  const activeSnapshot = result && result.snapshots[currentStep] ? result.snapshots[currentStep] : null;
  const currentHeadPos = activeSnapshot ? activeSnapshot.currentHead : initialHead;

  // Path coordinates for SVG chart
  const pathCoordinates = result
    ? result.headPath.slice(0, currentStep + 1).map((cyl, idx) => {
        const xPercent = maxCylinder > minCylinder ? ((cyl - minCylinder) / (maxCylinder - minCylinder)) * 100 : 50;
        return { x: xPercent, y: idx * 24 + 20, cyl };
      })
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header and Algorithm Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-5 border border-[var(--glass-border)] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase mb-1">
            <span className="p-1 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <HardDrive className="w-3.5 h-3.5" />
            </span>
            <span>Secondary Storage & Track Actuator</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Disk Scheduling Laboratory</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Track seek simulation for all 6 core algorithms: FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK.
          </p>
        </div>

        {/* Algorithm Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[var(--bg-elevated)] p-1.5 rounded-xl border border-[var(--glass-border)]">
          {(['FCFS', 'SSTF', 'SCAN', 'C_SCAN', 'LOOK', 'C_LOOK'] as DiskAlgorithm[]).map((algo) => (
            <button
              key={algo}
              onClick={() => setAlgorithm(algo)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                algorithm === algo
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold shadow-md shadow-cyan-500/25 ring-1 ring-cyan-400/40'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
              }`}
            >
              {algo.replace('_', '-')}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

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
          setCurrentStep((p) => Math.max(0, p - 1));
        }}
        onStepForward={() => {
          setIsPlaying(false);
          if (result && currentStep < result.snapshots.length - 1) {
            setCurrentStep((p) => p + 1);
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
        statusLabel={activeSnapshot?.log}
      />

      {/* Workload Inputs */}
      <div className="glass-panel rounded-2xl p-5 border border-[var(--glass-border)] space-y-4">
        <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          Disk & Track Parameters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="space-y-1.5">
            <label className="text-[var(--text-secondary)] block font-semibold">Cylinder Range [Min — Max]</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minCylinder}
                onChange={(e) => setMinCylinder(parseInt(e.target.value) || 0)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl px-2.5 py-2 text-[var(--text-primary)] text-center focus:border-cyan-400 outline-none transition"
              />
              <span className="text-[var(--text-muted)]">—</span>
              <input
                type="number"
                value={maxCylinder}
                onChange={(e) => setMaxCylinder(parseInt(e.target.value) || 199)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl px-2.5 py-2 text-[var(--text-primary)] text-center focus:border-cyan-400 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[var(--text-secondary)] block font-semibold">Initial Head Cylinder</label>
            <input
              type="number"
              value={initialHead}
              onChange={(e) => setInitialHead(parseInt(e.target.value) || 0)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:border-cyan-400 outline-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[var(--text-secondary)] block font-semibold">Initial Sweep Direction</label>
            <div className="flex gap-2">
              <button
                onClick={() => setDirection('LEFT')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 transition ${
                  direction === 'LEFT' ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/25' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--glass-border)]'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Decreasing</span>
              </button>
              <button
                onClick={() => setDirection('RIGHT')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 transition ${
                  direction === 'RIGHT' ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/25' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--glass-border)]'
                }`}
              >
                <span>Increasing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[var(--text-secondary)] block font-semibold">Request Queue</label>
            <input
              type="text"
              value={requestsInput}
              onChange={(e) => handleUpdateRequests(e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:border-cyan-400 outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            label="Total Head Movement"
            value={activeSnapshot ? activeSnapshot.totalMovementSoFar : result.totalHeadMovement}
            unit="cylinders"
            subtext="Cumulative track seeks"
            color="cyan"
          />
          <MetricCard
            label="Average Movement"
            value={result.averageMovement}
            unit="cyl/req"
            subtext="Total / Requests"
            color="blue"
          />
          <MetricCard
            label="Requests Serviced"
            value={currentStep}
            unit={`of ${result.serviceOrder.length}`}
            subtext={`Initial Head: ${initialHead}`}
            color="emerald"
          />
          <MetricCard
            label="Current Head Position"
            value={`Cyl ${currentHeadPos}`}
            subtext={`Range [${minCylinder} - ${maxCylinder}]`}
            color="violet"
          />
        </div>
      )}

      {/* Interactive Mechanical Magnetic Platter & Actuator Arm Graphic */}
      <DiskPlatterGraphic
        currentHead={currentHeadPos}
        minCylinder={minCylinder}
        maxCylinder={maxCylinder}
        requests={requests}
        visitedCylinders={activeSnapshot?.visitedCylinders ?? []}
        direction={direction}
        algorithm={algorithm}
      />

      {/* Graphical Disk Track Diagram */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-[var(--glass-border)] space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Interactive Disk Track & Seek Path Visualization</span>
          </h2>
          <span className="text-xs text-[var(--text-secondary)] font-mono">
            Service Order: &lt; {result?.serviceOrder.join(' → ')} &gt;
          </span>
        </div>

        {/* Linear Cylinder Rail */}
        <div className="relative pt-6 pb-4">
          <div className="w-full h-3 bg-[var(--bg-elevated)] rounded-full relative overflow-visible border border-[var(--glass-border)]">
            {/* Cylinders tick marks */}
            <span className="absolute -top-5 left-0 text-[10px] font-mono text-[var(--text-muted)] font-bold">{minCylinder}</span>
            <span className="absolute -top-5 right-0 text-[10px] font-mono text-[var(--text-muted)] font-bold">{maxCylinder}</span>

            {/* Request Points along rail */}
            {requests.map((req, idx) => {
              const xPercent = maxCylinder > minCylinder ? ((req - minCylinder) / (maxCylinder - minCylinder)) * 100 : 0;
              const isServiced = activeSnapshot?.visitedCylinders.includes(req);

              return (
                <div
                  key={idx}
                  style={{ left: `${xPercent}%` }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                      isServiced
                        ? 'bg-emerald-400 border-white shadow-md shadow-emerald-400/40 ring-2 ring-emerald-400/30'
                        : 'bg-amber-400 border-gray-900 shadow-sm'
                    }`}
                  />
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[var(--text-secondary)] whitespace-nowrap group-hover:text-[var(--text-primary)] font-bold">
                    {req}
                  </span>
                </div>
              );
            })}

            {/* Current Head Actuator Pointer */}
            {(() => {
              const headX = maxCylinder > minCylinder ? ((currentHeadPos - minCylinder) / (maxCylinder - minCylinder)) * 100 : 0;
              return (
                <div
                  style={{ left: `${headX}%` }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-300"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-600 border-2 border-white shadow-[0_0_15px_rgba(6,182,212,0.8)] flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold font-mono text-cyan-400 whitespace-nowrap bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-cyan-500/30 shadow-sm">
                    Head {currentHeadPos}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 2D Polyline Seek Path Canvas */}
        <div className="pt-4 border-t border-[var(--glass-border)]">
          <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Seek Path Trajectory (Time vs Cylinder)</div>
          <div className="w-full bg-[var(--bg-elevated)] rounded-xl p-3 border border-[var(--glass-border)] overflow-x-auto min-h-[160px] shadow-inner">
            <svg
              className="w-full"
              height={Math.max(140, pathCoordinates.length * 24 + 40)}
              viewBox={`0 0 1000 ${Math.max(140, pathCoordinates.length * 24 + 40)}`}
              preserveAspectRatio="none"
            >
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="1000" y2="20" stroke="rgba(255,255,255,0.08)" />
              <line x1="0" y1="80" x2="1000" y2="80" stroke="rgba(255,255,255,0.08)" />

              {/* Polyline Path */}
              {pathCoordinates.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Path Node Dots */}
              {pathCoordinates.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={(p.x / 100) * 1000}
                    cy={p.y}
                    r={idx === pathCoordinates.length - 1 ? 6 : 4}
                    fill={idx === pathCoordinates.length - 1 ? '#10B981' : '#4F80FF'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={(p.x / 100) * 1000 + 8}
                    y={p.y + 4}
                    fill="currentColor"
                    className="text-[var(--text-primary)]"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    #{idx}: Cyl {p.cyl}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Movement Breakdown Table */}
      {result && (
        <div className="glass-panel rounded-2xl p-5 border border-[var(--glass-border)] overflow-x-auto space-y-3 shadow-sm">
          <div className="text-xs font-bold text-[var(--text-primary)]">Seek Movements Breakdown</div>
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--glass-border)] text-[var(--text-secondary)] text-[11px] uppercase">
                <th className="pb-2">Step</th>
                <th className="pb-2">From Cylinder</th>
                <th className="pb-2">To Cylinder</th>
                <th className="pb-2">Seek Distance</th>
                <th className="pb-2">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {result.movements.map((m, idx) => {
                const isPassed = currentStep >= idx + 1;
                return (
                  <tr key={idx} className={isPassed ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
                    <td className="py-2">#{idx + 1}</td>
                    <td className="py-2">{m.from}</td>
                    <td className="py-2 font-bold">{m.to}</td>
                    <td className="py-2 text-cyan-400 font-bold">{m.distance} cyl</td>
                    <td className="py-2">
                      {m.isCircularWrap ? (
                        <span className="text-purple-400 font-semibold">Circular Wrap</span>
                      ) : m.isBoundaryJump ? (
                        <span className="text-amber-400 font-semibold">Boundary Sweep</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Request Serviced</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Event Logs */}
      {result && <LogViewer logs={result.logs} activeStep={currentStep} />}
    </div>
  );
};
