import React from 'react';
import { SyncProblem, ProducerConsumerState, ReadersWritersState, DiningPhilosophersState } from '../../engine/sync/types';
import { Layers, Coffee, BookOpen, ShieldAlert, CheckCircle2, Lock, Unlock, ArrowRight, User } from 'lucide-react';

interface SyncVisualizerGraphicProps {
  problem: SyncProblem;
  pcState?: ProducerConsumerState;
  rwState?: ReadersWritersState;
  diningState?: DiningPhilosophersState;
}

export const SyncVisualizerGraphic: React.FC<SyncVisualizerGraphicProps> = ({
  problem,
  pcState,
  rwState,
  diningState,
}) => {
  return (
    <div className="glass-panel-elevated rounded-2xl p-5 border border-[var(--glass-border)] space-y-4 shadow-md">
      {/* 1. PRODUCER CONSUMER FACTORY CONVEYOR BELT */}
      {problem === 'PRODUCER_CONSUMER' && pcState && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Automated Conveyor Belt & Traffic Semaphore Gate</h3>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">Real-time producer packet injection and consumer extraction</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                mutex = {pcState.mutex}
              </span>
            </div>
          </div>

          {/* Graphical Pipeline SVG */}
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Producer Hopper */}
              <div className="md:col-span-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-center space-y-1.5 shadow-sm">
                <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">Producer Unit</span>
                <div className="text-xs font-bold text-[var(--text-primary)]">Data Generator</div>
                <div className="text-[11px] font-mono text-cyan-400">Produced: {pcState.totalProduced} pkts</div>
                <div className="text-[10px] text-[var(--text-muted)]">Wait(empty) → Wait(mutex)</div>
              </div>

              {/* Conveyor Buffer Track */}
              <div className="md:col-span-6 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--glass-border)]">
                <div className="text-[10px] font-mono text-center text-[var(--text-muted)] mb-2 font-bold uppercase">
                  Shared Buffer Slots ({pcState.fullSlots} occupied / {pcState.emptySlots} free)
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {pcState.buffer.map((item, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square rounded-lg border text-center flex flex-col items-center justify-center p-1 transition-all ${
                        item !== null
                          ? 'bg-amber-500/20 border-amber-500 shadow-md ring-1 ring-amber-400/40'
                          : 'bg-[var(--bg-elevated)] border-[var(--glass-border)]'
                      }`}
                    >
                      <span className="text-[9px] font-mono text-[var(--text-muted)]">#{idx}</span>
                      {item ? (
                        <span className="text-xs font-bold font-mono text-amber-400 truncate max-w-full">
                          PKG
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-[var(--text-muted)] italic">Free</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Consumer Bay */}
              <div className="md:col-span-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center space-y-1.5 shadow-sm">
                <span className="text-[10px] font-mono font-bold uppercase text-purple-400">Consumer Unit</span>
                <div className="text-xs font-bold text-[var(--text-primary)]">Data Sink</div>
                <div className="text-[11px] font-mono text-purple-400">Consumed: {pcState.totalConsumed} pkts</div>
                <div className="text-[10px] text-[var(--text-muted)]">Wait(full) → Wait(mutex)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. READERS WRITERS DATABASE VAULT */}
      {problem === 'READERS_WRITERS' && rwState && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Database Vault & Concurrency Lock Barrier</h3>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">
                  Shared concurrent read access vs mutually exclusive write locking
                </p>
              </div>
            </div>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
              rwState.activeWriter
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : rwState.readerCount > 0
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--glass-border)]'
            }`}>
              {rwState.activeWriter ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              {rwState.activeWriter ? 'EXCLUSIVE WRITER LOCK' : rwState.readerCount > 0 ? `${rwState.readerCount} ACTIVE READERS` : 'VAULT UNLOCKED'}
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Readers Stream (Left) */}
            <div className="space-y-2 text-center">
              <span className="text-xs font-bold text-cyan-400 font-mono uppercase">Reader Threads</span>
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] space-y-1.5">
                <div className="text-xs text-[var(--text-primary)] font-semibold">Active: {rwState.activeReaders.length}</div>
                <div className="flex flex-wrap gap-1 justify-center">
                  {rwState.activeReaders.map((r, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold">
                      {r}
                    </span>
                  ))}
                  {rwState.activeReaders.length === 0 && (
                    <span className="text-[10px] text-[var(--text-muted)] italic">No active readers</span>
                  )}
                </div>
              </div>
            </div>

            {/* Central Database Record Safe */}
            <div className={`p-5 rounded-2xl border text-center transition-all shadow-lg ${
              rwState.activeWriter
                ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/40 shadow-rose-500/20'
                : rwState.readerCount > 0
                ? 'bg-emerald-500/20 border-emerald-500/60 ring-2 ring-emerald-400/30 shadow-emerald-500/20'
                : 'bg-[var(--bg-secondary)] border-[var(--glass-border)]'
            }`}>
              <div className="text-[10px] uppercase font-mono text-[var(--text-muted)] font-bold mb-1">
                Shared Memory Vault
              </div>
              <div className="text-sm font-bold font-mono text-[var(--text-primary)] mb-1">
                "{rwState.sharedDataContent}"
              </div>
              <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                {rwState.activeWriter ? 'WRITER MODIFYING DATA' : rwState.readerCount > 0 ? 'CONCURRENT DATA ACCESS' : 'IDLE'}
              </div>
            </div>

            {/* Writers Stream (Right) */}
            <div className="space-y-2 text-center">
              <span className="text-xs font-bold text-rose-400 font-mono uppercase">Writer Threads</span>
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] space-y-1.5">
                <div className="text-xs text-[var(--text-primary)] font-semibold">Exclusive Writer: {rwState.activeWriter || 'None'}</div>
                <div className="text-[10px] font-mono text-amber-400">
                  {rwState.waitingWriters.length} writer(s) queued in backlog
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DINING PHILOSOPHERS ROUND TABLE */}
      {problem === 'DINING_PHILOSOPHERS' && diningState && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Circular Table & Chopstick Resource Allocator</h3>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">
                  Visual top-down dining table with 5 philosophers and shared resource chopsticks
                </p>
              </div>
            </div>
            {diningState.isDeadlocked && (
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-pulse flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                CIRCULAR WAIT DEADLOCK ACTIVE
              </span>
            )}
          </div>

          {/* Circular Round Table SVG */}
          <div className="flex justify-center p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--glass-border)]">
            <svg viewBox="0 0 360 360" className="w-full max-w-[340px] h-auto select-none">
              {/* Circular Table Surface */}
              <circle cx="180" cy="180" r="120" fill="#151D2E" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
              <circle cx="180" cy="180" r="105" fill="#0D1322" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <circle cx="180" cy="180" r="28" fill="#1E293B" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              <text x="180" y="184" textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="monospace" fontWeight="bold">
                TABLE
              </text>

              {/* 5 Philosophers Placed Evenly on Perimeter */}
              {diningState.philosophers.map((ph, idx) => {
                const angleDeg = idx * 72 - 90;
                const rad = (angleDeg * Math.PI) / 180;
                const phX = 180 + 140 * Math.cos(rad);
                const phY = 180 + 140 * Math.sin(rad);

                const plateX = 180 + 80 * Math.cos(rad);
                const plateY = 180 + 80 * Math.sin(rad);

                // Chopstick between idx and (idx + 1) % 5
                const chopstickAngle = (idx * 72 + 36 - 90) * (Math.PI / 180);
                const chopX = 180 + 95 * Math.cos(chopstickAngle);
                const chopY = 180 + 95 * Math.sin(chopstickAngle);

                const isEating = ph.status === 'EATING';
                const isHungry = ph.status === 'HUNGRY';

                return (
                  <g key={ph.id}>
                    {/* Plate */}
                    <circle cx={plateX} cy={plateY} r="14" fill={isEating ? '#10B981' : '#1E293B'} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    {isEating && <circle cx={plateX} cy={plateY} r="7" fill="#FFFFFF" />}

                    {/* Chopstick */}
                    <line
                      x1={180 + 75 * Math.cos(chopstickAngle)}
                      y1={180 + 75 * Math.sin(chopstickAngle)}
                      x2={180 + 115 * Math.cos(chopstickAngle)}
                      y2={180 + 115 * Math.sin(chopstickAngle)}
                      stroke={diningState.isDeadlocked ? '#F43F5E' : '#F59E0B'}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Philosopher Node */}
                    <circle
                      cx={phX}
                      cy={phY}
                      r="22"
                      fill={isEating ? '#10B981' : isHungry ? '#F59E0B' : '#1E293B'}
                      stroke={diningState.isDeadlocked ? '#F43F5E' : '#FFFFFF'}
                      strokeWidth="2"
                      className="shadow-lg"
                    />
                    <text
                      x={phX}
                      y={phY + 4}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      P{idx}
                    </text>
                  </g>
                );
              })}

              {/* Deadlock Circular Chain Highlight */}
              {diningState.isDeadlocked && (
                <circle
                  cx="180"
                  cy="180"
                  r="95"
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="3"
                  strokeDasharray="8 6"
                  className="animate-pulse"
                />
              )}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
