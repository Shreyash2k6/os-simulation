import React, { useState } from 'react';
import { 
  BOOT_STAGES, 
  SYSCALL_TRACE, 
  PROCESS_VS_THREAD_SEGMENTS 
} from '../../engine/mechanisms/mechanismSim';
import { 
  Compass, 
  Cpu, 
  Shield, 
  ArrowRight, 
  Layers, 
  Terminal, 
  CheckCircle2, 
  Play, 
  RotateCcw,
  Binary
} from 'lucide-react';
import { PrivilegeRingsGraphic } from '../graphics/PrivilegeRingsGraphic';

export const OSMechanismsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BOOT' | 'SYSCALL' | 'PROCESS_THREAD'>('SYSCALL');

  // Boot sequence active step
  const [bootStepIdx, setBootStepIdx] = useState<number>(0);

  // Syscall trace active step
  const [syscallStepIdx, setSyscallStepIdx] = useState<number>(0);

  const activeSyscall = SYSCALL_TRACE[syscallStepIdx];
  const activeBoot = BOOT_STAGES[bootStepIdx];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-5 border border-[var(--glass-border)] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-semibold tracking-wider uppercase mb-1">
            <span className="p-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Compass className="w-3.5 h-3.5" />
            </span>
            <span>Kernel Internals & Hardware-OS Boundary</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">OS Mechanisms & Protection Explorer</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Visual architectural simulator for Cold Boot sequence, Dual Mode (Ring 3 vs Ring 0) trap transitions, and Thread memory models.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[var(--bg-elevated)] p-1.5 rounded-xl border border-[var(--glass-border)] text-xs font-mono">
          <button
            onClick={() => setActiveTab('SYSCALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'SYSCALL'
                ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold shadow-md shadow-indigo-500/25 ring-1 ring-indigo-400/40'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Dual Mode & Syscalls
          </button>
          <button
            onClick={() => setActiveTab('BOOT')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'BOOT'
                ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold shadow-md shadow-indigo-500/25 ring-1 ring-indigo-400/40'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Boot Sequence
          </button>
          <button
            onClick={() => setActiveTab('PROCESS_THREAD')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'PROCESS_THREAD'
                ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold shadow-md shadow-indigo-500/25 ring-1 ring-indigo-400/40'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Process vs Thread
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DUAL MODE & SYSTEM CALL TRANSITION                */}
      {/* ========================================================= */}
      {activeTab === 'SYSCALL' && (
        <div className="space-y-6">
          {/* Stepper Controls */}
          <div className="glass-panel rounded-2xl p-4 border border-[var(--glass-border)] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[var(--text-secondary)]">Instruction Step:</span>
              <span className="text-cyan-400 font-bold">
                Step {syscallStepIdx + 1} of {SYSCALL_TRACE.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSyscallStepIdx((p) => Math.max(0, p - 1))}
                disabled={syscallStepIdx === 0}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                Previous Step
              </button>
              <button
                onClick={() => setSyscallStepIdx((p) => Math.min(SYSCALL_TRACE.length - 1, p + 1))}
                disabled={syscallStepIdx === SYSCALL_TRACE.length - 1}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-xs font-bold text-white shadow-md shadow-indigo-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                Next Step
              </button>
              <button
                onClick={() => setSyscallStepIdx(0)}
                className="p-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                title="Reset trace"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Privilege Rings Graphic */}
          <PrivilegeRingsGraphic
            cpuRing={activeSyscall.cpuRing}
            action={activeSyscall.action}
            location={activeSyscall.location}
            explanation={activeSyscall.explanation}
          />

          {/* Dual Ring Visualizer Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ring 3 User Mode Box */}
            <div
              className={`p-6 rounded-2xl border transition-all shadow-md ${
                activeSyscall.cpuRing.includes('Ring 3')
                  ? 'bg-indigo-500/15 border-indigo-500 shadow-indigo-500/20 ring-1 ring-indigo-400'
                  : 'bg-[var(--bg-elevated)] border-[var(--glass-border)] opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-wider">
                  Ring 3: User Space (Unprivileged)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--glass-border)]">
                  CPL = 3
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                User applications, web browsers, shells. Hardware memory protection prevents direct port I/O and modifying kernel page tables.
              </p>
              {activeSyscall.cpuRing.includes('Ring 3') && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono text-emerald-400 font-bold">
                  CPU Execution Active in User Ring 3
                </div>
              )}
            </div>

            {/* Ring 0 Kernel Mode Box */}
            <div
              className={`p-6 rounded-2xl border transition-all shadow-md ${
                activeSyscall.cpuRing.includes('Ring 0')
                  ? 'bg-rose-500/15 border-rose-500 shadow-rose-500/20 ring-1 ring-rose-400'
                  : 'bg-[var(--bg-elevated)] border-[var(--glass-border)] opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold font-mono text-rose-400 uppercase tracking-wider">
                  Ring 0: Supervisor / Kernel Space
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--glass-border)]">
                  CPL = 0
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                OS Kernel Core, device drivers, interrupt dispatchers. Full unrestricted access to all CPU instructions (CR0, CR3, I/O ports).
              </p>
              {activeSyscall.cpuRing.includes('Ring 0') && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs font-mono text-rose-400 font-bold">
                  CPU Execution Active in Kernel Ring 0 (Privileged Trap)
                </div>
              )}
            </div>
          </div>

          {/* Current Micro-Step Details & CPU Registers */}
          <div className="glass-panel-elevated rounded-2xl p-6 border border-[var(--glass-border)] space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] font-bold">Active Phase</span>
                <h3 className="text-base font-bold text-[var(--text-primary)]">{activeSyscall.action}</h3>
                <span className="text-xs text-cyan-400 font-mono font-semibold">{activeSyscall.location}</span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] font-mono">
              {activeSyscall.explanation}
            </p>

            {/* Architectural Register State */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[var(--text-primary)] font-mono">x86_64 ABI Hardware Registers:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--glass-border)] shadow-sm">
                  <span className="text-[var(--text-muted)] block text-[10px]">RAX (Syscall / Return)</span>
                  <span className="text-indigo-400 font-bold truncate block">{activeSyscall.registers.rax}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--glass-border)] shadow-sm">
                  <span className="text-[var(--text-muted)] block text-[10px]">RDI (Arg 1: FD)</span>
                  <span className="text-cyan-400 font-bold truncate block">{activeSyscall.registers.rdi}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--glass-border)] shadow-sm">
                  <span className="text-[var(--text-muted)] block text-[10px]">RSI (Arg 2: Buffer)</span>
                  <span className="text-[var(--text-primary)] font-bold truncate block">{activeSyscall.registers.rsi}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--glass-border)] shadow-sm">
                  <span className="text-[var(--text-muted)] block text-[10px]">RDX (Arg 3: Count)</span>
                  <span className="text-[var(--text-primary)] font-bold truncate block">{activeSyscall.registers.rdx}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--glass-border)] shadow-sm">
                  <span className="text-[var(--text-muted)] block text-[10px]">RSP (Stack Pointer)</span>
                  <span className="text-amber-400 font-bold truncate block">{activeSyscall.registers.rsp}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--glass-border)] shadow-sm">
                  <span className="text-[var(--text-muted)] block text-[10px]">RIP (Instruction Pointer)</span>
                  <span className="text-purple-400 font-bold truncate block">{activeSyscall.registers.rip}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: BOOT SEQUENCE                                     */}
      {/* ========================================================= */}
      {activeTab === 'BOOT' && (
        <div className="space-y-6">
          <div className="glass-panel-elevated rounded-2xl p-6 border border-[var(--glass-border)] space-y-4 shadow-md">
            <h2 className="text-base font-bold text-[var(--text-primary)]">System Boot Stages & Silicon Initialization</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Trace how physical hardware transitions from cold reset (16-bit real mode) through bootloaders to 64-bit protected multitasking.
            </p>

            <div className="space-y-3 pt-2">
              {BOOT_STAGES.map((stage, idx) => {
                const isSelected = bootStepIdx === idx;

                return (
                  <div
                    key={stage.id}
                    onClick={() => setBootStepIdx(idx)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500 shadow-indigo-500/20 ring-1 ring-indigo-400'
                        : 'bg-[var(--bg-elevated)] border-[var(--glass-border)] hover:bg-[var(--glass-bg)]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <span className="text-xs font-bold font-mono text-[var(--text-primary)]">{stage.stageName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-cyan-400 font-semibold">
                        {stage.cpuMode}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                      {stage.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {stage.components.map((comp, cIdx) => (
                        <span key={cIdx} className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-[10px] font-mono text-cyan-400 font-medium">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PROCESS VS THREAD MEMORY BOUNDARIES               */}
      {/* ========================================================= */}
      {activeTab === 'PROCESS_THREAD' && (
        <div className="space-y-6">
          <div className="glass-panel-elevated rounded-2xl p-6 border border-[var(--glass-border)] space-y-4 shadow-md">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Process vs Thread Address Space Isolation</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Threads within the same process share virtual address space and heap, while maintaining isolated execution contexts (stacks & registers).
              </p>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--glass-border)] text-[var(--text-secondary)] text-[11px] uppercase">
                    <th className="pb-2.5">Memory / Resource Segment</th>
                    <th className="pb-2.5">Description</th>
                    <th className="pb-2.5 text-center">Shared Across Threads?</th>
                    <th className="pb-2.5 text-center">Isolated Per Process?</th>
                    <th className="pb-2.5">Example Attribute</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-border)]">
                  {PROCESS_VS_THREAD_SEGMENTS.map((seg, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-bold text-[var(--text-primary)]">{seg.segmentName}</td>
                      <td className="py-3 text-[var(--text-secondary)]">{seg.description}</td>
                      <td className="py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            seg.sharedAcrossThreads
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {seg.sharedAcrossThreads ? 'SHARED' : 'PRIVATE'}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          ISOLATED
                        </span>
                      </td>
                      <td className="py-3 text-cyan-400 text-[11px] font-semibold">{seg.exampleData}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
