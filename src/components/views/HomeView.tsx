import React from 'react';
import { 
  Cpu, 
  Layers, 
  HardDrive, 
  FileText, 
  ShieldAlert, 
  RefreshCw, 
  Compass, 
  GitCompare, 
  Play, 
  Activity, 
  Terminal, 
  CheckCircle2, 
  Zap, 
  FolderTree,
  Binary,
  ArrowRight
} from 'lucide-react';

interface HomeViewProps {
  onSelectNav: (navId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectNav }) => {
  const simulationCards = [
    {
      id: 'cpu',
      title: 'CPU Scheduling',
      category: 'Processor Scheduling',
      description: 'Gantt charts and metrics for FCFS, SJF, SRTF, Priority (preemptive & non-preemptive), and Round Robin.',
      icon: <Cpu className="w-5 h-5 text-[#4F80FF]" />,
      badge: '6 Algorithms',
      accentColor: 'from-[#4F80FF]/20 via-[#4F80FF]/5 to-transparent',
      borderColor: 'border-[#4F80FF]/30 hover:border-[#4F80FF]',
      iconBg: 'bg-[#4F80FF]/15 text-[#4F80FF]'
    },
    {
      id: 'process',
      title: 'Process Lifecycle & PCB',
      category: 'Kernel Execution',
      description: '5-state interactive transition model (New, Ready, Running, Waiting, Terminated) with detailed PCB inspector.',
      icon: <Activity className="w-5 h-5 text-[#2DD4BF]" />,
      badge: 'State Machine',
      accentColor: 'from-[#2DD4BF]/20 via-[#2DD4BF]/5 to-transparent',
      borderColor: 'border-[#2DD4BF]/30 hover:border-[#2DD4BF]',
      iconBg: 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
    },
    {
      id: 'memory',
      title: 'Memory Allocation',
      category: 'Memory Subsystem',
      description: 'First Fit, Best Fit, Worst Fit, Fixed Partitioning, and Buddy System with recursive power-of-2 splitting.',
      icon: <Layers className="w-5 h-5 text-[#906DF7]" />,
      badge: 'Buddy System',
      accentColor: 'from-[#906DF7]/20 via-[#906DF7]/5 to-transparent',
      borderColor: 'border-[#906DF7]/30 hover:border-[#906DF7]',
      iconBg: 'bg-[#906DF7]/15 text-[#906DF7]'
    },
    {
      id: 'paging',
      title: 'Paging & Address Translation',
      category: 'Virtual Memory',
      description: 'FIFO, LRU, Optimal page replacement, frame slot tracking, and logical-to-physical address translation.',
      icon: <FileText className="w-5 h-5 text-[#EC4899]" />,
      badge: 'MMU Calculator',
      accentColor: 'from-[#EC4899]/20 via-[#EC4899]/5 to-transparent',
      borderColor: 'border-[#EC4899]/30 hover:border-[#EC4899]',
      iconBg: 'bg-[#EC4899]/15 text-[#EC4899]'
    },
    {
      id: 'deadlock',
      title: 'Deadlock & Banker’s Algorithm',
      category: 'Resource Allocation',
      description: 'Banker’s Safety algorithm, resource request evaluation, and Resource Allocation Graph (RAG) cycle detector.',
      icon: <ShieldAlert className="w-5 h-5 text-[#F43F5E]" />,
      badge: 'RAG Cycles',
      accentColor: 'from-[#F43F5E]/20 via-[#F43F5E]/5 to-transparent',
      borderColor: 'border-[#F43F5E]/30 hover:border-[#F43F5E]',
      iconBg: 'bg-[#F43F5E]/15 text-[#F43F5E]'
    },
    {
      id: 'sync',
      title: 'Process Synchronization',
      category: 'Concurrency Control',
      description: 'Bounded buffer Producer-Consumer, Readers-Writers (preference policies), and Dining Philosophers table.',
      icon: <RefreshCw className="w-5 h-5 text-[#F59E0B]" />,
      badge: 'Semaphores',
      accentColor: 'from-[#F59E0B]/20 via-[#F59E0B]/5 to-transparent',
      borderColor: 'border-[#F59E0B]/30 hover:border-[#F59E0B]',
      iconBg: 'bg-[#F59E0B]/15 text-[#F59E0B]'
    },
    {
      id: 'disk',
      title: 'Disk Head Scheduling',
      category: 'Secondary Storage',
      description: 'All 6 disk algorithms: FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK with animated seek path track visualization.',
      icon: <HardDrive className="w-5 h-5 text-[#06B6D4]" />,
      badge: '6 Algorithms',
      accentColor: 'from-[#06B6D4]/20 via-[#06B6D4]/5 to-transparent',
      borderColor: 'border-[#06B6D4]/30 hover:border-[#06B6D4]',
      iconBg: 'bg-[#06B6D4]/15 text-[#06B6D4]'
    },
    {
      id: 'filesystem',
      title: 'Virtual File System',
      category: 'Storage Architecture',
      description: 'Simulated 64 disk blocks with Contiguous, Linked, and Indexed allocation, directory tree, and block bitmap.',
      icon: <FolderTree className="w-5 h-5 text-[#10B981]" />,
      badge: 'Sector Map',
      accentColor: 'from-[#10B981]/20 via-[#10B981]/5 to-transparent',
      borderColor: 'border-[#10B981]/30 hover:border-[#10B981]',
      iconBg: 'bg-[#10B981]/15 text-[#10B981]'
    },
    {
      id: 'segmentation',
      title: 'Segmentation Visualizer',
      category: 'Memory Management',
      description: 'Segment table base & limit checking, offset bounds translation, and segmentation fault trap trigger.',
      icon: <Binary className="w-5 h-5 text-[#8B5CF6]" />,
      badge: 'Bounds Protection',
      accentColor: 'from-[#8B5CF6]/20 via-[#8B5CF6]/5 to-transparent',
      borderColor: 'border-[#8B5CF6]/30 hover:border-[#8B5CF6]',
      iconBg: 'bg-[#8B5CF6]/15 text-[#8B5CF6]'
    },
    {
      id: 'mechanisms',
      title: 'OS Mechanisms & Dual Mode',
      category: 'Kernel Internals',
      description: 'Boot sequence explorer, Ring 3 (User) to Ring 0 (Kernel) syscall trap transitions, and Process vs Thread memory.',
      icon: <Compass className="w-5 h-5 text-[#4F80FF]" />,
      badge: 'Dual Mode',
      accentColor: 'from-[#4F80FF]/20 via-[#4F80FF]/5 to-transparent',
      borderColor: 'border-[#4F80FF]/30 hover:border-[#4F80FF]',
      iconBg: 'bg-[#4F80FF]/15 text-[#4F80FF]'
    },
    {
      id: 'compare',
      title: 'Algorithm Comparison Lab',
      category: 'Benchmarking Suite',
      description: 'Run multiple algorithms side-by-side on the same input dataset and analyze relative efficiencies.',
      icon: <GitCompare className="w-5 h-5 text-[#2DD4BF]" />,
      badge: 'Comparative',
      accentColor: 'from-[#2DD4BF]/20 via-[#2DD4BF]/5 to-transparent',
      borderColor: 'border-[#2DD4BF]/30 hover:border-[#2DD4BF]',
      iconBg: 'bg-[#2DD4BF]/15 text-[#2DD4BF]'
    },
    {
      id: 'tests',
      title: 'Automated Algorithm Tests',
      category: 'Verification Suite',
      description: 'Live test harness verifying textbook reference cases and boundary conditions with instant feedback.',
      icon: <CheckCircle2 className="w-5 h-5 text-[#10B981]" />,
      badge: '10 Tests',
      accentColor: 'from-[#10B981]/20 via-[#10B981]/5 to-transparent',
      borderColor: 'border-[#10B981]/30 hover:border-[#10B981]',
      iconBg: 'bg-[#10B981]/15 text-[#10B981]'
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Banner */}
      <div className="relative rounded-3xl p-6 sm:p-10 overflow-hidden glass-panel-elevated border border-[var(--glass-border)]">
        <div className="absolute -right-16 -top-16 w-88 h-88 bg-gradient-to-br from-[#4F80FF]/25 via-[#2DD4BF]/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-88 h-88 bg-gradient-to-tr from-[#906DF7]/25 via-[#EC4899]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-white/[0.08] border border-slate-300 dark:border-white/15 text-xs text-[#2DD4BF] font-mono mb-4 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-[#2DD4BF]" />
            <span className="font-semibold">Deterministic Graphical OS Laboratory</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--text-primary)] mb-4 leading-tight">
            Explore Operating System Mechanics <br />
            <span className="aurora-text-gradient">
              In Real Graphical Time
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed mb-6">
            Configure parameters, step through reversible algorithmic states, inspect memory maps and CPU registers, and benchmark real performance metrics across all core OS domains.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onSelectNav('cpu')}
              className="px-5 py-2.5 rounded-xl aurora-btn-primary text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch CPU Simulator</span>
            </button>

            <button
              onClick={() => onSelectNav('compare')}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/15 text-[var(--text-primary)] text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <GitCompare className="w-4 h-4 text-[#2DD4BF]" />
              <span>Compare Algorithms</span>
            </button>

            <button
              onClick={() => onSelectNav('tests')}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/15 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Terminal className="w-4 h-4 text-[#10B981]" />
              <span>Run Automated Tests</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive OS Architecture Hierarchy Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-[var(--glass-border)]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#2DD4BF]" />
            <span>Interactive Operating System Hierarchy</span>
          </h2>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">Select a layer to launch simulator</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onSelectNav('process')}
            className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 text-left transition group cursor-pointer shadow-sm"
          >
            <div className="text-[10px] font-mono text-[#4F80FF] uppercase font-bold tracking-wider">Layer 4: User Space</div>
            <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[#2DD4BF] transition">Applications & Processes</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">Ring 3 unprivileged</div>
          </button>

          <button
            onClick={() => onSelectNav('mechanisms')}
            className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 text-left transition group cursor-pointer shadow-sm"
          >
            <div className="text-[10px] font-mono text-[#2DD4BF] uppercase font-bold tracking-wider">Layer 3: System Calls</div>
            <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[#2DD4BF] transition">Trap & Dispatch Table</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">POSIX ABI, int 0x80 / syscall</div>
          </button>

          <button
            onClick={() => onSelectNav('cpu')}
            className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 text-left transition group cursor-pointer shadow-sm"
          >
            <div className="text-[10px] font-mono text-[#906DF7] uppercase font-bold tracking-wider">Layer 2: Kernel Core</div>
            <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[#2DD4BF] transition">Scheduler & Memory</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">Ring 0 supervisor execution</div>
          </button>

          <button
            onClick={() => onSelectNav('disk')}
            className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 text-left transition group cursor-pointer shadow-sm"
          >
            <div className="text-[10px] font-mono text-[#06B6D4] uppercase font-bold tracking-wider">Layer 1: Hardware & I/O</div>
            <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[#2DD4BF] transition">Storage & Memory Units</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">MMU, Cylinders, DMA, PIC</div>
          </button>
        </div>
      </div>

      {/* Simulation Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <span>Simulation Laboratories</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-[#4F80FF] border border-blue-500/30 font-mono font-bold">
              12 Laboratories
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {simulationCards.map((card) => (
            <div
              key={card.id}
              onClick={() => onSelectNav(card.id)}
              className={`p-5 rounded-2xl glass-panel bg-gradient-to-b ${card.accentColor} border ${card.borderColor} transition-all duration-300 cursor-pointer flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl`}
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className={`p-2.5 rounded-xl ${card.iconBg} border border-white/10 group-hover:scale-110 transition-transform shadow-sm`}>
                    {card.icon}
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-white/10 text-[var(--text-secondary)] border border-slate-300 dark:border-white/10 font-medium">
                    {card.badge}
                  </span>
                </div>

                <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] mb-1 font-semibold">{card.category}</div>
                <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[#2DD4BF] transition-colors mb-2">
                  {card.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                  {card.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] font-medium transition">
                <span>Enter Laboratory</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#2DD4BF] transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
