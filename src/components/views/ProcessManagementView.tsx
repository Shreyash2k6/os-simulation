import React, { useState } from 'react';
import { 
  Activity, 
  Plus, 
  Play, 
  Pause, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  ArrowRight, 
  RotateCcw, 
  Sliders, 
  Layers, 
  Terminal 
} from 'lucide-react';
import { LogViewer } from '../common/LogViewer';
import { ProcessStateDiagram } from '../graphics/ProcessStateDiagram';

export type ProcessState = 'NEW' | 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED';

export interface SimulatedProcess {
  pid: number;
  name: string;
  state: ProcessState;
  priority: number;
  burstTime: number;
  remainingTime: number;
  programCounter: string;
  registers: {
    rax: string;
    rbx: string;
    rcx: string;
    rdx: string;
    rsp: string;
  };
  memoryBase: number;
  memoryLimit: number;
  openFiles: string[];
  color: string;
}

const INITIAL_PROCESSES: SimulatedProcess[] = [
  {
    pid: 101,
    name: 'system-logger',
    state: 'RUNNING',
    priority: 1,
    burstTime: 12,
    remainingTime: 7,
    programCounter: '0x004018A4',
    registers: { rax: '0x00000001', rbx: '0x00000000', rcx: '0x7ffd1020', rdx: '0x00000018', rsp: '0x7ffd1000' },
    memoryBase: 0x100000,
    memoryLimit: 0x050000,
    openFiles: ['/var/log/syslog', 'stdin', 'stdout'],
    color: '#4F80FF'
  },
  {
    pid: 102,
    name: 'http-server',
    state: 'READY',
    priority: 2,
    burstTime: 20,
    remainingTime: 18,
    programCounter: '0x004032C0',
    registers: { rax: '0x00000050', rbx: '0x00001f90', rcx: '0x7ffe4080', rdx: '0x00000200', rsp: '0x7ffe4060' },
    memoryBase: 0x200000,
    memoryLimit: 0x080000,
    openFiles: ['socket:80', 'stdout'],
    color: '#10B981'
  },
  {
    pid: 103,
    name: 'db-worker',
    state: 'WAITING',
    priority: 2,
    burstTime: 15,
    remainingTime: 11,
    programCounter: '0x00405100',
    registers: { rax: '0x00000000', rbx: '0x00000003', rcx: '0x7ffe8800', rdx: '0x00000000', rsp: '0x7ffe87e0' },
    memoryBase: 0x300000,
    memoryLimit: 0x0c0000,
    openFiles: ['/data/db.sqlite', 'stdin', 'stdout'],
    color: '#8B5CF6'
  },
  {
    pid: 104,
    name: 'shell-prompt',
    state: 'NEW',
    priority: 3,
    burstTime: 6,
    remainingTime: 6,
    programCounter: '0x00400000',
    registers: { rax: '0x00000000', rbx: '0x00000000', rcx: '0x00000000', rdx: '0x00000000', rsp: '0x7ffff000' },
    memoryBase: 0x400000,
    memoryLimit: 0x030000,
    openFiles: ['stdin', 'stdout', 'stderr'],
    color: '#F59E0B'
  }
];

export const ProcessManagementView: React.FC = () => {
  const [processes, setProcesses] = useState<SimulatedProcess[]>(INITIAL_PROCESSES);
  const [selectedPid, setSelectedPid] = useState<number>(101);
  const [logs, setLogs] = useState<string[]>([
    'Process Management simulator initialized with 4 baseline processes.',
    'PID 101 currently occupying simulated CPU core.'
  ]);

  const selectedProcess = processes.find((p) => p.pid === selectedPid) || processes[0];

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const handleCreateProcess = () => {
    const nextPid = Math.max(...processes.map((p) => p.pid), 100) + 1;
    const colors = ['#4F80FF', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4'];
    const newP: SimulatedProcess = {
      pid: nextPid,
      name: `proc-${nextPid}`,
      state: 'NEW',
      priority: 2,
      burstTime: 10,
      remainingTime: 10,
      programCounter: '0x00400000',
      registers: { rax: '0x00000000', rbx: '0x00000000', rcx: '0x00000000', rdx: '0x00000000', rsp: '0x7ffff000' },
      memoryBase: 0x500000 + (nextPid - 100) * 0x10000,
      memoryLimit: 0x040000,
      openFiles: ['stdin', 'stdout'],
      color: colors[nextPid % colors.length]
    };
    setProcesses([...processes, newP]);
    setSelectedPid(nextPid);
    addLog(`Created new simulated process PID ${nextPid} ("${newP.name}") in NEW state.`);
  };

  // State Transition Actions
  const handleAdmit = (pid: number) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.pid === pid && p.state === 'NEW') {
          addLog(`Long-term scheduler ADMITTED PID ${pid} into READY queue.`);
          return { ...p, state: 'READY' };
        }
        return p;
      })
    );
  };

  const handleDispatch = (pid: number) => {
    setProcesses((prev) => {
      return prev.map((p) => {
        if (p.state === 'RUNNING' && p.pid !== pid) {
          return { ...p, state: 'READY' };
        }
        if (p.pid === pid && p.state === 'READY') {
          addLog(`Short-term scheduler DISPATCHED PID ${pid} to CPU Core.`);
          return { ...p, state: 'RUNNING' };
        }
        return p;
      });
    });
  };

  const handleInterrupt = (pid: number) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.pid === pid && p.state === 'RUNNING') {
          addLog(`Timer interrupt: Time slice expired for PID ${pid}. Moved to READY queue.`);
          return { ...p, state: 'READY' };
        }
        return p;
      })
    );
  };

  const handleIOWait = (pid: number) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.pid === pid && p.state === 'RUNNING') {
          addLog(`PID ${pid} requested I/O block (e.g. read/socket). Moved to WAITING state.`);
          return { ...p, state: 'WAITING' };
        }
        return p;
      })
    );
  };

  const handleIOComplete = (pid: number) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.pid === pid && p.state === 'WAITING') {
          addLog(`I/O completion interrupt received for PID ${pid}. Re-enqueued to READY queue.`);
          return { ...p, state: 'READY' };
        }
        return p;
      })
    );
  };

  const handleTerminate = (pid: number) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.pid === pid && p.state !== 'TERMINATED') {
          addLog(`PID ${pid} executed exit() system call. State transitioned to TERMINATED (Zombie reaped).`);
          return { ...p, state: 'TERMINATED', remainingTime: 0 };
        }
        return p;
      })
    );
  };

  const getStateBadgeColor = (st: ProcessState) => {
    switch (st) {
      case 'NEW':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30';
      case 'READY':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30';
      case 'RUNNING':
        return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse';
      case 'WAITING':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30';
      case 'TERMINATED':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-5 border border-[var(--glass-border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#2DD4BF] uppercase mb-1 font-bold">
            <Activity className="w-4 h-4 text-[#2DD4BF]" />
            <span>Process Management & Scheduling Visualizer</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">Process Lifecycle & PCB Laboratory</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Simulate 5-state process transitions (New, Ready, Running, Waiting, Terminated) and inspect simulated Process Control Blocks.
          </p>
        </div>

        <button
          onClick={handleCreateProcess}
          className="px-4 py-2.5 rounded-xl aurora-btn-primary text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Spawn New Process</span>
        </button>
      </div>

      {/* Interactive 5-State Graphical Transition Model */}
      <ProcessStateDiagram
        processes={processes}
        selectedProcess={selectedProcess}
        onSelectProcess={(pid) => setSelectedPid(pid)}
        onAdmit={handleAdmit}
        onDispatch={handleDispatch}
        onInterrupt={handleInterrupt}
        onWaitIO={handleWaitIO}
        onCompleteIO={handleCompleteIO}
        onTerminate={handleTerminate}
      />

      {/* Main Controller: Selected Process Actions & PCB Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* State Transition Actions for Selected Process */}
        <div className="glass-panel rounded-2xl p-5 border border-[var(--glass-border)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#2DD4BF]" />
              <span>Simulated OS Actions</span>
            </h2>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${getStateBadgeColor(selectedProcess.state)}`}>
              {selectedProcess.state}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs space-y-1">
            <div className="text-[var(--text-primary)] font-bold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedProcess.color }} />
              Active Target: PID {selectedProcess.pid}
            </div>
            <div className="text-[var(--text-secondary)] font-mono text-[11px] truncate">{selectedProcess.name}</div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase text-[var(--text-muted)] tracking-wider font-semibold">Available Transitions</div>

            {selectedProcess.state === 'NEW' && (
              <button
                onClick={() => handleAdmit(selectedProcess.pid)}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-600 dark:text-[#4F80FF] text-xs font-semibold flex items-center justify-between transition cursor-pointer"
              >
                <span>Admit Process to Ready Queue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {selectedProcess.state === 'READY' && (
              <button
                onClick={() => handleDispatch(selectedProcess.pid)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-[#10B981] text-xs font-semibold flex items-center justify-between transition cursor-pointer"
              >
                <span>Dispatch to CPU Core</span>
                <Play className="w-4 h-4 fill-current" />
              </button>
            )}

            {selectedProcess.state === 'RUNNING' && (
              <div className="space-y-2">
                <button
                  onClick={() => handleInterrupt(selectedProcess.pid)}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-semibold flex items-center justify-between transition cursor-pointer"
                >
                  <span>Timer Interrupt (Pre-empt to Ready)</span>
                  <Clock className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleIOWait(selectedProcess.pid)}
                  className="w-full py-2 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-xs font-semibold flex items-center justify-between transition cursor-pointer"
                >
                  <span>Trigger I/O Wait (Block to Waiting)</span>
                  <Pause className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {selectedProcess.state === 'WAITING' && (
              <button
                onClick={() => handleIOComplete(selectedProcess.pid)}
                className="w-full py-2.5 px-3 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-600 dark:text-[#2DD4BF] text-xs font-semibold flex items-center justify-between transition cursor-pointer"
              >
                <span>Complete I/O Interrupt (To Ready)</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}

            {selectedProcess.state !== 'TERMINATED' && (
              <button
                onClick={() => handleTerminate(selectedProcess.pid)}
                className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center justify-between transition mt-3 cursor-pointer"
              >
                <span>Terminate Process (exit() syscall)</span>
                <AlertCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Process Control Block (PCB) Inspector */}
        <div className="lg:col-span-2 glass-panel-elevated rounded-2xl p-5 border border-[var(--glass-border)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#906DF7]" />
              <span>PCB Inspector (Simulated Process Control Block)</span>
            </h2>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">Address: 0xFFFF8000_{selectedProcess.pid}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {/* General Metadata */}
            <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="text-[11px] font-bold text-[#4F80FF] uppercase border-b border-slate-200 dark:border-white/10 pb-1">Process Identification</div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">PID:</span><span className="text-[var(--text-primary)] font-bold">{selectedProcess.pid}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Name:</span><span className="text-[var(--text-primary)]">{selectedProcess.name}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">State:</span><span className="text-[#10B981] font-bold">{selectedProcess.state}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Priority:</span><span className="text-[var(--text-primary)]">{selectedProcess.priority}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Remaining Burst:</span><span className="text-[#F59E0B] font-bold">{selectedProcess.remainingTime} ticks</span></div>
            </div>

            {/* Architectural Registers & Program Counter */}
            <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="text-[11px] font-bold text-[#2DD4BF] uppercase border-b border-slate-200 dark:border-white/10 pb-1">CPU Registers (Saved State)</div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">PC (RIP):</span><span className="text-[#2DD4BF] font-bold">{selectedProcess.programCounter}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">RAX:</span><span className="text-[var(--text-primary)]">{selectedProcess.registers.rax}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">RBX:</span><span className="text-[var(--text-primary)]">{selectedProcess.registers.rbx}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">RCX:</span><span className="text-[var(--text-primary)]">{selectedProcess.registers.rcx}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">RSP:</span><span className="text-[var(--text-primary)]">{selectedProcess.registers.rsp}</span></div>
            </div>

            {/* Memory Bounds */}
            <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="text-[11px] font-bold text-[#906DF7] uppercase border-b border-slate-200 dark:border-white/10 pb-1">Memory Bounds & MMU</div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Base Address:</span><span className="text-[var(--text-primary)]">0x{selectedProcess.memoryBase.toString(16).toUpperCase()}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Limit Register:</span><span className="text-[var(--text-primary)]">0x{selectedProcess.memoryLimit.toString(16).toUpperCase()} ({Math.round(selectedProcess.memoryLimit / 1024)} KB)</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">End Address:</span><span className="text-[var(--text-primary)]">0x{(selectedProcess.memoryBase + selectedProcess.memoryLimit).toString(16).toUpperCase()}</span></div>
            </div>

            {/* I/O & Open Files Table */}
            <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="text-[11px] font-bold text-[#F59E0B] uppercase border-b border-slate-200 dark:border-white/10 pb-1">I/O Status & Open File Descriptors</div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedProcess.openFiles.map((fd, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-[var(--text-secondary)] text-[10px] border border-slate-300 dark:border-white/10 font-bold">
                    fd[{i}]: {fd}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Logs */}
      <LogViewer logs={logs} title="Kernel Process Lifecycle Events" />
    </div>
  );
};
