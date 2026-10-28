import React, { useState } from 'react';
import { 
  SyncProblem, 
  ProducerConsumerState, 
  ReadersWritersState, 
  DiningPhilosophersState, 
  ReadersWritersPolicy 
} from '../../engine/sync/types';
import { 
  createInitialProducerConsumerState, 
  produceItem, 
  consumeItem, 
  createInitialReadersWritersState, 
  requestRead, 
  releaseRead, 
  requestWrite, 
  releaseWrite, 
  createInitialDiningState, 
  togglePhilosopherHunger, 
  triggerNaiveDeadlock 
} from '../../engine/sync/synchronizer';
import { MetricCard } from '../common/MetricCard';
import { SyncVisualizerGraphic } from '../graphics/SyncVisualizerGraphic';
import { RefreshCw, Users, ShieldAlert, CheckCircle2, RotateCcw, AlertTriangle, Layers, BookOpen, Coffee, ArrowRight } from 'lucide-react';

export const SynchronizationView: React.FC = () => {
  const [activeProblem, setActiveProblem] = useState<SyncProblem>('PRODUCER_CONSUMER');

  // Producer-Consumer State
  const [pcState, setPcState] = useState<ProducerConsumerState>(() => createInitialProducerConsumerState(5));

  // Readers-Writers State
  const [rwPolicy, setRwPolicy] = useState<ReadersWritersPolicy>('READER_PREFERENCE');
  const [rwState, setRwState] = useState<ReadersWritersState>(() => createInitialReadersWritersState('READER_PREFERENCE'));

  // Dining Philosophers State
  const [diningState, setDiningState] = useState<DiningPhilosophersState>(() => createInitialDiningState('ASYMMETRIC_RESOURCE_HIERARCHY'));

  // Change RW policy
  const handlePolicyChange = (policy: ReadersWritersPolicy) => {
    setRwPolicy(policy);
    setRwState(createInitialReadersWritersState(policy));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header and Problem Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-5 border border-[var(--glass-border)] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-semibold tracking-wider uppercase mb-1">
            <span className="p-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <RefreshCw className="w-3.5 h-3.5" />
            </span>
            <span>Process Synchronization & Concurrency</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Synchronization Laboratory</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Mutex locks, counting semaphores, race-condition prevention, and classical concurrency anomalies.
          </p>
        </div>

        {/* Problem Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[var(--bg-elevated)] p-1.5 rounded-xl border border-[var(--glass-border)] text-xs font-mono">
          <button
            onClick={() => setActiveProblem('PRODUCER_CONSUMER')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeProblem === 'PRODUCER_CONSUMER'
                ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold shadow-md shadow-amber-500/25 ring-1 ring-amber-400/40'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Producer–Consumer
          </button>
          <button
            onClick={() => setActiveProblem('READERS_WRITERS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeProblem === 'READERS_WRITERS'
                ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold shadow-md shadow-amber-500/25 ring-1 ring-amber-400/40'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Readers–Writers
          </button>
          <button
            onClick={() => setActiveProblem('DINING_PHILOSOPHERS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeProblem === 'DINING_PHILOSOPHERS'
                ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold shadow-md shadow-amber-500/25 ring-1 ring-amber-400/40'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Dining Philosophers
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PROBLEM 1: PRODUCER - CONSUMER                                */}
      {/* ============================================================== */}
      {activeProblem === 'PRODUCER_CONSUMER' && (
        <div className="space-y-6">
          {/* Status Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard
              label="Semaphore mutex"
              value={pcState.mutex}
              subtext="Binary Critical Section Lock"
              color={pcState.mutex === 1 ? 'emerald' : 'rose'}
            />
            <MetricCard
              label="Semaphore empty"
              value={pcState.emptySlots}
              subtext={`Free buffer capacity (${pcState.bufferCapacity})`}
              color="cyan"
            />
            <MetricCard
              label="Semaphore full"
              value={pcState.fullSlots}
              subtext="Occupied item slots"
              color="amber"
            />
            <MetricCard
              label="Items Produced"
              value={pcState.totalProduced}
              subtext={`Consumed: ${pcState.totalConsumed} items`}
              color="violet"
            />
          </div>

          {/* Interactive Factory Conveyor Belt Graphic */}
          <SyncVisualizerGraphic problem="PRODUCER_CONSUMER" pcState={pcState} />

          {/* Interactive Bounded Buffer Visualizer */}
          <div className="glass-panel-elevated rounded-2xl p-6 border border-[var(--glass-border)] space-y-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Circular Bounded Buffer (Capacity: {pcState.bufferCapacity})</span>
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">
                  In Pointer: <span className="text-cyan-400 font-bold">#{pcState.inPtr}</span> | Out Pointer: <span className="text-purple-400 font-bold">#{pcState.outPtr}</span>
                </p>
              </div>

              <button
                onClick={() => setPcState(createInitialProducerConsumerState(pcState.bufferCapacity))}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Buffer</span>
              </button>
            </div>

            {/* Buffer Slots */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {pcState.buffer.map((item, idx) => {
                const isIn = pcState.inPtr === idx;
                const isOut = pcState.outPtr === idx;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-center transition-all flex flex-col justify-between min-h-[120px] shadow-sm ${
                      item !== null
                        ? 'bg-amber-500/15 border-amber-500/40 ring-1 ring-amber-400/30'
                        : 'bg-[var(--bg-elevated)] border-[var(--glass-border)]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                      <span>Slot #{idx}</span>
                      <div className="flex gap-1">
                        {isIn && <span className="text-cyan-400 font-bold px-1 rounded bg-cyan-500/10 border border-cyan-500/30">IN</span>}
                        {isOut && <span className="text-purple-400 font-bold px-1 rounded bg-purple-500/10 border border-purple-500/30">OUT</span>}
                      </div>
                    </div>

                    <div className="py-2">
                      {item ? (
                        <span className="font-bold font-mono text-xs text-amber-400 break-all">{item}</span>
                      ) : (
                        <span className="text-[var(--text-muted)] italic font-mono text-xs">Empty</span>
                      )}
                    </div>

                    <div className="text-[10px] text-[var(--text-secondary)] font-mono">
                      {item ? 'Full' : 'Available'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setPcState(produceItem(pcState, 'Producer-1'))}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/25 hover:opacity-95 transition flex items-center gap-2"
              >
                <span>Produce Item (wait(empty), wait(mutex))</span>
              </button>

              <button
                onClick={() => setPcState(consumeItem(pcState, 'Consumer-1'))}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white text-xs font-semibold shadow-md shadow-amber-500/25 hover:opacity-95 transition flex items-center gap-2"
              >
                <span>Consume Item (wait(full), wait(mutex))</span>
              </button>
            </div>

            {/* Explanation Callout */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-xs font-mono space-y-1 shadow-inner">
              <div className="text-amber-400 font-bold">Semaphore Synchronization State:</div>
              <div className="text-[var(--text-secondary)]">{pcState.ruleExplanation}</div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PROBLEM 2: READERS - WRITERS                                  */}
      {/* ============================================================== */}
      {activeProblem === 'READERS_WRITERS' && (
        <div className="space-y-6">
          {/* Policy Selection */}
          <div className="glass-panel rounded-2xl p-4 border border-[var(--glass-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
            <span className="text-[var(--text-primary)] font-semibold">Priority & Starvation Invariant:</span>
            <div className="flex flex-wrap gap-2">
              {(['READER_PREFERENCE', 'WRITER_PREFERENCE', 'FAIR'] as ReadersWritersPolicy[]).map((pol) => (
                <button
                  key={pol}
                  onClick={() => handlePolicyChange(pol)}
                  className={`px-3 py-1.5 rounded-lg font-mono transition ${
                    rwPolicy === pol
                      ? 'bg-amber-400 text-black font-bold shadow-md shadow-amber-400/25'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--glass-border)]'
                  }`}
                >
                  {pol.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Database Vault Graphic */}
          <SyncVisualizerGraphic problem="READERS_WRITERS" rwState={rwState} />

          {/* Database / Shared State Canvas */}
          <div className="glass-panel-elevated rounded-2xl p-6 border border-[var(--glass-border)] space-y-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>Shared Database & In-Memory Resource</span>
                </h2>
                <span className="text-xs text-[var(--text-secondary)] font-mono">
                  Active Readers: <span className="text-cyan-400 font-bold">{rwState.readerCount}</span> | Exclusive Writer: <span className="text-rose-400 font-bold">{rwState.activeWriter || 'None'}</span>
                </span>
              </div>

              <button
                onClick={() => setRwState(createInitialReadersWritersState(rwPolicy))}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Shared Database Center Card */}
            <div
              className={`p-6 rounded-2xl border text-center transition-all shadow-md ${
                rwState.activeWriter
                  ? 'bg-rose-500/15 border-rose-500 shadow-rose-500/20 ring-1 ring-rose-400'
                  : rwState.readerCount > 0
                  ? 'bg-emerald-500/15 border-emerald-500/50 shadow-emerald-500/20'
                  : 'bg-[var(--bg-elevated)] border-[var(--glass-border)]'
              }`}
            >
              <div className="text-[11px] uppercase tracking-wider font-mono text-[var(--text-secondary)] mb-1">
                Database Shared Record
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-[var(--text-primary)] mb-2">
                {rwState.sharedDataContent}
              </div>
              <div className="text-xs font-mono font-semibold">
                Lock status: {rwState.activeWriter ? <span className="text-rose-400 font-bold">EXCLUSIVE WRITE LOCK (MUTEX HELD)</span> : rwState.readerCount > 0 ? <span className="text-emerald-400 font-bold">CONCURRENT READ LOCK ({rwState.readerCount} ACTIVE)</span> : <span className="text-[var(--text-muted)]">UNLOCKED / IDLE</span>}
              </div>
            </div>

            {/* Actions: Dispatch Readers and Writers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Readers Panel */}
              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] space-y-3 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                  <span>Reader Processes</span>
                  <span className="text-cyan-400 font-mono">({rwState.activeReaders.length} active)</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setRwState(requestRead(rwState, `Reader-${rwState.activeReaders.length + rwState.waitingReaders.length + 1}`))}
                    className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-400 hover:text-white text-xs font-semibold transition shadow-sm"
                  >
                    Request Read Lock
                  </button>
                  {rwState.activeReaders.length > 0 && (
                    <button
                      onClick={() => setRwState(releaseRead(rwState, rwState.activeReaders[0]))}
                      className="py-2 px-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs transition font-mono"
                    >
                      Release One
                    </button>
                  )}
                </div>

                <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                  Active Readers: [{rwState.activeReaders.join(', ') || 'None'}]
                </div>
                {rwState.waitingReaders.length > 0 && (
                  <div className="text-[11px] font-mono text-amber-400">
                    Waiting Readers: [{rwState.waitingReaders.join(', ')}]
                  </div>
                )}
              </div>

              {/* Writers Panel */}
              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] space-y-3 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                  <span>Writer Processes</span>
                  <span className="text-rose-400 font-mono">({rwState.activeWriter ? '1 active' : '0 active'})</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setRwState(requestWrite(rwState, `Writer-${rwState.waitingWriters.length + 1}`))}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 hover:text-white text-xs font-semibold transition shadow-sm"
                  >
                    Request Exclusive Write Lock
                  </button>
                  {rwState.activeWriter && (
                    <button
                      onClick={() => setRwState(releaseWrite(rwState))}
                      className="py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 text-xs font-semibold transition font-mono"
                    >
                      Commit & Release
                    </button>
                  )}
                </div>

                <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                  Active Writer: {rwState.activeWriter || 'None'}
                </div>
                {rwState.waitingWriters.length > 0 && (
                  <div className="text-[11px] font-mono text-amber-400">
                    Waiting Writers: [{rwState.waitingWriters.join(', ')}]
                  </div>
                )}
              </div>
            </div>

            {/* Explanation */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-xs font-mono space-y-1">
              <span className="text-amber-400 font-bold">Rule Invariant: </span>
              <span className="text-[var(--text-secondary)]">{rwState.ruleExplanation}</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PROBLEM 3: DINING PHILOSOPHERS                                */}
      {/* ============================================================== */}
      {activeProblem === 'DINING_PHILOSOPHERS' && (
        <div className="space-y-6">
          {/* Policy and Deadlock Trigger Bar */}
          <div className="glass-panel rounded-2xl p-4 border border-[var(--glass-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-primary)] font-semibold">Strategy:</span>
              <span className="px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] text-cyan-400 border border-[var(--glass-border)] font-mono font-bold">
                {diningState.policy === 'ASYMMETRIC_RESOURCE_HIERARCHY'
                  ? 'Asymmetric Resource Ordering (Safe)'
                  : 'Naive Simultaneous Pickup (Deadlock Prone)'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDiningState(triggerNaiveDeadlock(diningState))}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Simulate Circular Wait Deadlock</span>
              </button>

              <button
                onClick={() => setDiningState(createInitialDiningState('ASYMMETRIC_RESOURCE_HIERARCHY'))}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Reset to Safe Hierarchy</span>
              </button>
            </div>
          </div>

          {/* Interactive Circular Dining Table Graphic */}
          <SyncVisualizerGraphic problem="DINING_PHILOSOPHERS" diningState={diningState} />

          {/* Dining Table Visualizer */}
          <div className="glass-panel-elevated rounded-2xl p-6 border border-[var(--glass-border)] space-y-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span>The 5 Philosophers Table</span>
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">
                  Click on any philosopher card to toggle Thinking → Hungry → Eating
                </p>
              </div>

              {diningState.isDeadlocked && (
                <span className="px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-400 font-bold font-mono text-xs animate-pulse">
                  DEADLOCK ACTIVE
                </span>
              )}
            </div>

            {/* Circular Table Representation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {diningState.philosophers.map((ph, idx) => {
                const leftForkIdx = idx;
                const rightForkIdx = (idx + 1) % 5;

                return (
                  <div
                    key={ph.id}
                    onClick={() => setDiningState(togglePhilosopherHunger(diningState, idx))}
                    className={`p-4 rounded-2xl border text-center cursor-pointer transition-all hover:scale-105 shadow-sm ${
                      ph.status === 'EATING'
                        ? 'bg-emerald-500/20 border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-400'
                        : ph.status === 'HUNGRY'
                        ? 'bg-amber-500/20 border-amber-500/50 shadow-amber-500/20'
                        : 'bg-[var(--bg-elevated)] border-[var(--glass-border)] hover:border-white/30'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-[var(--text-muted)] mb-1">Philosopher #{idx}</div>
                    <div className="text-sm font-bold text-[var(--text-primary)] mb-2">{ph.name}</div>

                    <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold mb-3 border ${
                      ph.status === 'EATING'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : ph.status === 'HUNGRY'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--glass-border)]'
                    }`}>
                      {ph.status}
                    </div>

                    <div className="text-[10px] font-mono space-y-1 text-[var(--text-secondary)]">
                      <div>Left Fork #{leftForkIdx}: {ph.hasLeftFork ? <span className="text-emerald-400 font-bold">Acquired</span> : 'Free'}</div>
                      <div>Right Fork #{rightForkIdx}: {ph.hasRightFork ? <span className="text-emerald-400 font-bold">Acquired</span> : 'Free'}</div>
                      <div className="text-cyan-400 font-semibold pt-1 border-t border-[var(--glass-border)]">Eaten: {ph.eatCount} times</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanation Alert */}
            <div
              className={`p-4 rounded-xl border text-xs font-mono shadow-sm ${
                diningState.isDeadlocked
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : 'bg-[var(--bg-elevated)] border-[var(--glass-border)] text-[var(--text-secondary)]'
              }`}
            >
              <div className="font-bold mb-1 text-[var(--text-primary)]">Synchronization Invariant:</div>
              <div>{diningState.deadlockExplanation}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
