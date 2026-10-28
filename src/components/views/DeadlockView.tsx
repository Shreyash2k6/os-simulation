import React, { useState, useEffect } from 'react';
import { 
  BankerState, 
  BankerResult, 
  ResourceRequestEvaluation, 
  RAGGraph 
} from '../../engine/deadlock/types';
import { 
  runBankersAlgorithm, 
  evaluateResourceRequest, 
  analyzeRAG, 
  DEFAULT_BANKER_STATE, 
  calculateNeedMatrix 
} from '../../engine/deadlock/banker';
import { ControlBar } from '../common/ControlBar';
import { MetricCard } from '../common/MetricCard';
import { LogViewer } from '../common/LogViewer';
import { RagGraphCanvas } from '../graphics/RagGraphCanvas';
import { ShieldAlert, ShieldCheck, Play, RotateCcw, AlertTriangle, ArrowRight, Share2, Check, Cpu } from 'lucide-react';

export const DeadlockView: React.FC = () => {
  const [bankerState, setBankerState] = useState<BankerState>(DEFAULT_BANKER_STATE);
  const [bankerResult, setBankerResult] = useState<BankerResult>(() => runBankersAlgorithm(DEFAULT_BANKER_STATE));

  // Step-by-step safety sequence state
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Resource Request Tester State
  const [requestProcIdx, setRequestProcIdx] = useState<number>(1); // P1
  const [requestVector, setRequestVector] = useState<number[]>([1, 0, 2]);
  const [requestEval, setRequestEval] = useState<ResourceRequestEvaluation | null>(null);

  // RAG (Resource Allocation Graph) State
  const [activeTab, setActiveTab] = useState<'BANKER' | 'REQUEST_TEST' | 'RAG_GRAPH'>('BANKER');

  useEffect(() => {
    const res = runBankersAlgorithm(bankerState);
    setBankerResult(res);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [bankerState]);

  const handleCellChange = (matrixName: 'allocation' | 'max', pIdx: number, rIdx: number, val: number) => {
    const nextVal = Math.max(0, val);
    const updated = JSON.parse(JSON.stringify(bankerState)) as BankerState;
    updated[matrixName][pIdx][rIdx] = nextVal;
    updated.need = calculateNeedMatrix(updated.max, updated.allocation);
    setBankerState(updated);
  };

  const handleAvailableChange = (rIdx: number, val: number) => {
    const nextVal = Math.max(0, val);
    const updated = { ...bankerState };
    updated.available = [...updated.available];
    updated.available[rIdx] = nextVal;
    setBankerState(updated);
  };

  const handleTestRequest = () => {
    const evaluation = evaluateResourceRequest(bankerState, requestProcIdx, requestVector);
    setRequestEval(evaluation);
  };

  const activeSnapshot = bankerResult && currentStep > 0 && bankerResult.steps[currentStep - 1]
    ? bankerResult.steps[currentStep - 1]
    : null;

  // Preset demo RAG Graph
  const sampleRAG: RAGGraph = {
    nodes: [
      { id: 'P1', name: 'Process P1', type: 'process' },
      { id: 'P2', name: 'Process P2', type: 'process' },
      { id: 'P3', name: 'Process P3', type: 'process' },
      { id: 'R1', name: 'Resource R1 (Printer)', type: 'resource', instances: 1 },
      { id: 'R2', name: 'Resource R2 (Tape Drive)', type: 'resource', instances: 1 },
      { id: 'R3', name: 'Resource R3 (Plotter)', type: 'resource', instances: 1 }
    ],
    edges: [
      { id: 'e1', from: 'R1', to: 'P1', type: 'allocation' },
      { id: 'e2', from: 'P1', to: 'R2', type: 'request' },
      { id: 'e3', from: 'R2', to: 'P2', type: 'allocation' },
      { id: 'e4', from: 'P2', to: 'R3', type: 'request' },
      { id: 'e5', from: 'R3', to: 'P3', type: 'allocation' },
      { id: 'e6', from: 'P3', to: 'R1', type: 'request' } // circular wait!
    ],
    hasCycle: false,
    cycleNodes: [],
    isDeadlocked: false,
    explanation: ''
  };

  const analyzedRAG = analyzeRAG(sampleRAG);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-5 border border-[var(--glass-border)] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-rose-400 font-semibold tracking-wider uppercase mb-1">
            <span className="p-1 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="w-3.5 h-3.5" />
            </span>
            <span>Deadlock Avoidance & Verification</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Banker’s Algorithm & Resource Graph</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Evaluate Need = Max − Allocation, step through safety sequence discovery, test real-time resource requests, and detect RAG wait cycles.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-elevated)] p-1.5 rounded-xl border border-[var(--glass-border)] text-xs font-mono">
          <button
            onClick={() => setActiveTab('BANKER')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'BANKER'
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold shadow-md shadow-rose-500/25 ring-1 ring-rose-400/40'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Banker's Safety
          </button>
          <button
            onClick={() => setActiveTab('REQUEST_TEST')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'REQUEST_TEST'
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold shadow-md shadow-rose-500/25 ring-1 ring-rose-400/40'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Resource Request
          </button>
          <button
            onClick={() => setActiveTab('RAG_GRAPH')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'RAG_GRAPH'
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold shadow-md shadow-rose-500/25 ring-1 ring-rose-400/40'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            RAG Graph
          </button>
        </div>
      </div>

      {/* Safety Status Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all flex items-center justify-between shadow-md ${
          bankerResult.isSafe
            ? 'bg-emerald-500/10 border-emerald-500/40 shadow-emerald-500/10'
            : 'bg-rose-500/15 border-rose-500/50 shadow-rose-500/20'
        }`}
      >
        <div className="flex items-center gap-3">
          {bankerResult.isSafe ? (
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-[var(--text-primary)]">
              {bankerResult.isSafe ? 'SYSTEM IS IN A PROVABLY SAFE STATE' : 'SYSTEM IS IN AN UNSAFE STATE (DEADLOCK RISK)'}
            </div>
            <div className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">{bankerResult.explanation}</div>
          </div>
        </div>

        {bankerResult.isSafe && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-emerald-500/30 text-xs font-mono">
            <span className="text-[var(--text-secondary)]">Safe Execution Order:</span>
            <span className="text-emerald-400 font-bold tracking-wider">&lt; {bankerResult.safeSequence.join(' → ')} &gt;</span>
          </div>
        )}
      </div>

      {activeTab === 'BANKER' && (
        <div className="space-y-6">
          {/* Step Controls */}
          <ControlBar
            currentStep={currentStep}
            totalSteps={bankerResult.steps.length}
            isPlaying={isPlaying}
            speed={1}
            canStepBack={currentStep > 0}
            canStepForward={currentStep < bankerResult.steps.length}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onStepBack={() => {
              setIsPlaying(false);
              setCurrentStep((p) => Math.max(0, p - 1));
            }}
            onStepForward={() => {
              setIsPlaying(false);
              setCurrentStep((p) => Math.min(bankerResult.steps.length, p + 1));
            }}
            onReset={() => {
              setIsPlaying(false);
              setCurrentStep(0);
            }}
            onSpeedChange={() => {}}
            onScrub={(s) => {
              setIsPlaying(false);
              setCurrentStep(s);
            }}
            statusLabel={activeSnapshot?.reason || 'Ready to step through Banker safety algorithm.'}
          />

          {/* Matrix Tables: Available, Allocation, Max, Need */}
          <div className="glass-panel rounded-2xl p-5 border border-[var(--glass-border)] space-y-5">
            {/* Available Vector Editor */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-primary)] font-bold uppercase tracking-wider">Available Vector (Free Instances):</span>
                <span className="text-[var(--text-muted)]">(Available in pool)</span>
              </div>
              <div className="flex items-center gap-3">
                {bankerState.resourceNames.map((resName, rIdx) => (
                  <div key={resName} className="flex items-center gap-1.5">
                    <span className="text-rose-400 font-bold">{resName}:</span>
                    <input
                      type="number"
                      min="0"
                      value={bankerState.available[rIdx]}
                      onChange={(e) => handleAvailableChange(rIdx, parseInt(e.target.value) || 0)}
                      className="bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-lg px-2.5 py-1 text-[var(--text-primary)] w-14 text-center focus:border-rose-400 outline-none transition"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Matrix Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--glass-border)] text-[var(--text-secondary)] text-[11px] uppercase">
                    <th className="pb-2.5 text-left font-bold text-[var(--text-primary)]">Process</th>
                    <th className="pb-2.5 text-indigo-400 font-bold" colSpan={bankerState.resourceCount}>Allocation (Alloc)</th>
                    <th className="pb-2.5 text-purple-400 font-bold" colSpan={bankerState.resourceCount}>Maximum (Max)</th>
                    <th className="pb-2.5 text-emerald-400 font-bold" colSpan={bankerState.resourceCount}>Need = Max − Alloc</th>
                    <th className="pb-2.5 text-right font-bold text-[var(--text-primary)]">Status</th>
                  </tr>
                  <tr className="border-b border-[var(--glass-border)] text-[var(--text-muted)] text-[10px]">
                    <th></th>
                    {bankerState.resourceNames.map((r) => <th key={`a-${r}`}>{r}</th>)}
                    {bankerState.resourceNames.map((r) => <th key={`m-${r}`}>{r}</th>)}
                    {bankerState.resourceNames.map((r) => <th key={`n-${r}`} className="text-emerald-400">{r}</th>)}
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-border)]">
                  {bankerState.processes.map((proc, pIdx) => {
                    const isExamined = activeSnapshot && activeSnapshot.processIndex === pIdx;
                    const isFinished = activeSnapshot && activeSnapshot.finishVector[pIdx];

                    return (
                      <tr
                        key={proc}
                        className={`transition-colors ${
                          isExamined ? 'bg-rose-500/10 font-bold ring-1 ring-rose-400/30' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <td className="py-2.5 text-left font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          {isFinished && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          <span>{proc}</span>
                        </td>

                        {/* Allocation cells */}
                        {bankerState.allocation[pIdx].map((val, rIdx) => (
                          <td key={`alloc-${pIdx}-${rIdx}`} className="py-2.5">
                            <input
                              type="number"
                              min="0"
                              value={val}
                              onChange={(e) => handleCellChange('allocation', pIdx, rIdx, parseInt(e.target.value) || 0)}
                              className="bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded px-1.5 py-0.5 text-[var(--text-primary)] w-11 text-center focus:border-indigo-400 outline-none"
                            />
                          </td>
                        ))}

                        {/* Max cells */}
                        {bankerState.max[pIdx].map((val, rIdx) => (
                          <td key={`max-${pIdx}-${rIdx}`} className="py-2.5">
                            <input
                              type="number"
                              min="0"
                              value={val}
                              onChange={(e) => handleCellChange('max', pIdx, rIdx, parseInt(e.target.value) || 0)}
                              className="bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded px-1.5 py-0.5 text-[var(--text-primary)] w-11 text-center focus:border-purple-400 outline-none"
                            />
                          </td>
                        ))}

                        {/* Calculated Need cells */}
                        {bankerResult.needMatrix[pIdx]?.map((val, rIdx) => (
                          <td key={`need-${pIdx}-${rIdx}`} className="py-2.5 text-emerald-400 font-bold">
                            {val}
                          </td>
                        ))}

                        <td className="py-2.5 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isFinished
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--glass-border)]'
                            }`}
                          >
                            {isFinished ? 'FINISHED' : 'WAITING'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Work Vector Step Display */}
            {activeSnapshot && (
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] flex items-center justify-between text-xs font-mono shadow-sm">
                <span className="text-[var(--text-secondary)]">
                  Current Work Vector at Step #{activeSnapshot.step}:
                </span>
                <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                  Work = [{activeSnapshot.workVector.join(', ')}]
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resource Request Evaluation Tab */}
      {activeTab === 'REQUEST_TEST' && (
        <div className="glass-panel-elevated rounded-2xl p-6 border border-[var(--glass-border)] space-y-5 shadow-md">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">Hypothetical Resource-Request Algorithm</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Verify if granting an instantaneous request vector (Request<sub>i</sub>) from process P<sub>i</sub> preserves safety or creates potential deadlock.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <label className="text-[var(--text-secondary)] block mb-1 font-semibold">Requesting Process</label>
              <select
                value={requestProcIdx}
                onChange={(e) => setRequestProcIdx(parseInt(e.target.value))}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-[var(--text-primary)] outline-none focus:border-rose-400 transition"
              >
                {bankerState.processes.map((p, idx) => (
                  <option key={p} value={idx}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {bankerState.resourceNames.map((rName, rIdx) => (
              <div key={rName}>
                <label className="text-[var(--text-secondary)] block mb-1 font-semibold">Request for {rName}</label>
                <input
                  type="number"
                  min="0"
                  value={requestVector[rIdx] || 0}
                  onChange={(e) => {
                    const nextReq = [...requestVector];
                    nextReq[rIdx] = Math.max(0, parseInt(e.target.value) || 0);
                    setRequestVector(nextReq);
                  }}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-[var(--text-primary)] outline-none focus:border-rose-400 transition"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleTestRequest}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white text-xs font-bold shadow-md shadow-rose-500/25 hover:opacity-95 transition"
          >
            Evaluate Request Feasibility
          </button>

          {requestEval && (
            <div
              className={`p-4 rounded-xl border space-y-2 text-xs font-mono shadow-md ${
                requestEval.canBeGrantedImmediately
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/50 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
                {requestEval.canBeGrantedImmediately ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                )}
                <span>
                  {requestEval.canBeGrantedImmediately
                    ? `REQUEST GRANTED: Process ${requestEval.processId} safely allocates resources.`
                    : `REQUEST DENIED: Process ${requestEval.processId} must wait.`}
                </span>
              </div>
              <ul className="space-y-1 list-disc list-inside text-[var(--text-secondary)]">
                {requestEval.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Resource Allocation Graph (RAG) Tab */}
      {activeTab === 'RAG_GRAPH' && (
        <div className="glass-panel-elevated rounded-2xl p-6 border border-[var(--glass-border)] space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Share2 className="w-4 h-4 text-rose-400" />
                <span>Resource Allocation Graph (RAG) & Cycle Detector</span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Visual directed graph: circular processes request or hold rectangular resources. DFS traversal detects circular wait.
              </p>
            </div>
            <span
              className={`text-xs font-mono font-bold px-3 py-1 rounded-lg border ${
                analyzedRAG.hasCycle
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}
            >
              {analyzedRAG.hasCycle ? 'CYCLE DETECTED (DEADLOCK RISK)' : 'CYCLE FREE (NO DEADLOCK)'}
            </span>
          </div>

          {/* Interactive Visual Directed Graph Canvas */}
          <RagGraphCanvas
            rag={analyzedRAG}
            safeSequence={bankerResult.safeSequence}
            isSafe={bankerResult.isSafe}
          />
        </div>
      )}
    </div>
  );
};
