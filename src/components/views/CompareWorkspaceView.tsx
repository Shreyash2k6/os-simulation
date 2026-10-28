import React, { useState } from 'react';
import { runCPUScheduler } from '../../engine/cpu/scheduler';
import { runPageReplacement } from '../../engine/paging/pager';
import { runDiskScheduler } from '../../engine/disk/diskScheduler';
import { runMemoryAllocator } from '../../engine/memory/allocator';
import { GitCompare, Download, Check, Cpu, HardDrive, FileText, Layers, Trophy } from 'lucide-react';

export const CompareWorkspaceView: React.FC = () => {
  const [domain, setDomain] = useState<'CPU' | 'PAGING' | 'DISK' | 'MEMORY'>('CPU');

  // CPU Benchmark state
  const [cpuWorkload, setCpuWorkload] = useState([
    { id: 'P1', name: 'P1', arrivalTime: 0, burstTime: 8, priority: 2 },
    { id: 'P2', name: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
    { id: 'P3', name: 'P3', arrivalTime: 2, burstTime: 9, priority: 3 },
    { id: 'P4', name: 'P4', arrivalTime: 3, burstTime: 5, priority: 2 }
  ]);

  // Paging Benchmark state
  const [pageRefs, setPageRefs] = useState<number[]>([7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1]);
  const [frames, setFrames] = useState<number>(3);

  // Disk Benchmark state
  const [diskRequests, setDiskRequests] = useState<number[]>([98, 183, 37, 122, 14, 124, 65, 67]);
  const [diskHead, setDiskHead] = useState<number>(53);

  // Memory Benchmark state
  const [memRequests, setMemRequests] = useState([
    { id: 'r1', processId: 'P1', size: 120, action: 'ALLOCATE' as const },
    { id: 'r2', processId: 'P2', size: 250, action: 'ALLOCATE' as const },
    { id: 'r3', processId: 'P3', size: 100, action: 'ALLOCATE' as const },
    { id: 'r4', processId: 'P1', size: 120, action: 'DEALLOCATE' as const },
    { id: 'r5', processId: 'P4', size: 90, action: 'ALLOCATE' as const }
  ]);

  // Compute CPU Results
  const cpuAlgorithms: ('FCFS' | 'SJF' | 'SRTF' | 'ROUND_ROBIN')[] = ['FCFS', 'SJF', 'SRTF', 'ROUND_ROBIN'];
  const cpuResults = cpuAlgorithms.map((algo) => {
    return runCPUScheduler({
      algorithm: algo,
      processes: cpuWorkload,
      timeQuantum: 2
    });
  });

  // Compute Paging Results
  const pagingAlgorithms: ('FIFO' | 'LRU' | 'OPTIMAL')[] = ['FIFO', 'LRU', 'OPTIMAL'];
  const pagingResults = pagingAlgorithms.map((algo) => {
    return runPageReplacement({
      algorithm: algo,
      referenceString: pageRefs,
      frameCount: frames
    });
  });

  // Compute Disk Results
  const diskAlgorithms: ('FCFS' | 'SSTF' | 'SCAN' | 'C_SCAN' | 'LOOK' | 'C_LOOK')[] = ['FCFS', 'SSTF', 'SCAN', 'C_SCAN', 'LOOK', 'C_LOOK'];
  const diskResults = diskAlgorithms.map((algo) => {
    return runDiskScheduler({
      algorithm: algo,
      cylinderRange: [0, 199],
      initialHead: diskHead,
      requests: diskRequests,
      direction: 'RIGHT'
    });
  });

  // Compute Memory Results
  const memAlgorithms: ('FIRST_FIT' | 'BEST_FIT' | 'WORST_FIT')[] = ['FIRST_FIT', 'BEST_FIT', 'WORST_FIT'];
  const memResults = memAlgorithms.map((algo) => {
    return runMemoryAllocator({
      algorithm: algo,
      totalMemory: 1024,
      requests: memRequests
    });
  });

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (domain === 'CPU') {
      csvContent += 'Algorithm,Avg Waiting Time,Avg Turnaround Time,Avg Response Time,CPU Utilization,Context Switches\n';
      cpuResults.forEach((r) => {
        csvContent += `${r.algorithm},${r.averageWaitingTime},${r.averageTurnaroundTime},${r.averageResponseTime},${r.cpuUtilization}%,${r.totalContextSwitches}\n`;
      });
    } else if (domain === 'PAGING') {
      csvContent += 'Algorithm,Page Hits,Page Faults,Hit Ratio,Fault Ratio\n';
      pagingResults.forEach((r) => {
        csvContent += `${r.algorithm},${r.metrics.pageHits},${r.metrics.pageFaults},${r.metrics.hitRatio}%,${r.metrics.faultRatio}%\n`;
      });
    } else if (domain === 'DISK') {
      csvContent += 'Algorithm,Total Head Movement,Average Seek Distance\n';
      diskResults.forEach((r) => {
        csvContent += `${r.algorithm},${r.totalHeadMovement},${r.averageMovement}\n`;
      });
    } else {
      csvContent += 'Algorithm,Allocated Memory,Free Memory,Internal Frag,External Frag,Utilization\n';
      memResults.forEach((r) => {
        csvContent += `${r.algorithm},${r.finalMetrics.allocatedMemory},${r.finalMetrics.freeMemory},${r.finalMetrics.internalFragmentation},${r.finalMetrics.externalFragmentation},${r.finalMetrics.utilizationPercentage}%\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `oslab_${domain.toLowerCase()}_comparison.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header and Domain Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-5 border border-[var(--glass-border)] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase mb-1">
            <span className="p-1 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <GitCompare className="w-3.5 h-3.5" />
            </span>
            <span>Multi-Algorithm Benchmarking Laboratory</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Algorithmic Comparison Workspace</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Evaluate and benchmark compatible operating system algorithms on identical workloads with transparent, verifiable metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Domain switcher */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-elevated)] p-1.5 rounded-xl border border-[var(--glass-border)] text-xs font-mono">
            {(['CPU', 'PAGING', 'DISK', 'MEMORY'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDomain(d)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  domain === d
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold shadow-md shadow-cyan-500/25 ring-1 ring-cyan-400/40'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition flex items-center gap-1.5 text-xs font-mono shadow-sm"
            title="Export benchmark metrics as CSV"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline font-semibold">Export CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. CPU COMPARISON                                         */}
      {/* ========================================================= */}
      {domain === 'CPU' && (
        <div className="space-y-6">
          <div className="glass-panel-elevated rounded-2xl p-6 border border-[var(--glass-border)] space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>CPU Scheduling Comparative Benchmark (Workload: {cpuWorkload.length} processes)</span>
              </h2>
              <span className="text-xs text-[var(--text-secondary)] font-mono bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--glass-border)]">Quantum = 2 ticks</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--glass-border)] text-[var(--text-secondary)] text-[11px] uppercase">
                    <th className="pb-3">Algorithm</th>
                    <th className="pb-3">Avg Waiting Time (WT)</th>
                    <th className="pb-3">Avg Turnaround Time (TAT)</th>
                    <th className="pb-3">Avg Response Time (RT)</th>
                    <th className="pb-3">CPU Utilization</th>
                    <th className="pb-3">Context Switches</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-border)]">
                  {cpuResults.map((res) => {
                    const isMinWT = res.averageWaitingTime === Math.min(...cpuResults.map((r) => r.averageWaitingTime));

                    return (
                      <tr key={res.algorithm} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 font-bold text-[var(--text-primary)] flex items-center gap-2">
                          <span>{res.algorithm.replace('_', ' ')}</span>
                          {isMinWT && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold flex items-center gap-1 shadow-sm">
                              <Trophy className="w-2.5 h-2.5" />
                              BEST WT
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-cyan-400 font-bold text-sm">
                          {res.averageWaitingTime} ticks
                        </td>
                        <td className="py-3 text-indigo-400 font-bold text-sm">
                          {res.averageTurnaroundTime} ticks
                        </td>
                        <td className="py-3 text-[var(--text-secondary)]">
                          {res.averageResponseTime} ticks
                        </td>
                        <td className="py-3 text-emerald-400 font-bold">
                          {res.cpuUtilization}%
                        </td>
                        <td className="py-3 text-[var(--text-primary)] font-bold">
                          {res.totalContextSwitches}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. PAGING COMPARISON                                      */}
      {/* ========================================================= */}
      {domain === 'PAGING' && (
        <div className="space-y-6">
          <div className="glass-panel-elevated rounded-2xl p-6 border border-[var(--glass-border)] space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Page Replacement Benchmark ({frames} Frames, {pageRefs.length} References)</span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--glass-border)] text-[var(--text-secondary)] text-[11px] uppercase">
                    <th className="pb-3">Algorithm</th>
                    <th className="pb-3">Page Faults</th>
                    <th className="pb-3">Page Hits</th>
                    <th className="pb-3">Hit Ratio</th>
                    <th className="pb-3">Fault Ratio</th>
                    <th className="pb-3">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-border)]">
                  {pagingResults.map((res) => (
                    <tr key={res.algorithm} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-bold text-[var(--text-primary)]">{res.algorithm}</td>
                      <td className="py-3 text-rose-400 font-bold text-sm">{res.metrics.pageFaults}</td>
                      <td className="py-3 text-emerald-400 font-bold text-sm">{res.metrics.pageHits}</td>
                      <td className="py-3 text-cyan-400 font-bold text-sm">{res.metrics.hitRatio}%</td>
                      <td className="py-3 text-[var(--text-secondary)]">{res.metrics.faultRatio}%</td>
                      <td className="py-3 text-[var(--text-muted)] text-[11px]">
                        {res.algorithm === 'OPTIMAL' ? 'Theoretical benchmark (Belady ideal)' : 'Practical online strategy'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. DISK COMPARISON                                        */}
      {/* ========================================================= */}
      {domain === 'DISK' && (
        <div className="space-y-6">
          <div className="glass-panel-elevated rounded-2xl p-6 border border-[var(--glass-border)] space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span>Disk Head Movement Benchmark (Initial Head: {diskHead}, {diskRequests.length} Requests)</span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--glass-border)] text-[var(--text-secondary)] text-[11px] uppercase">
                    <th className="pb-3">Algorithm</th>
                    <th className="pb-3">Total Head Movement</th>
                    <th className="pb-3">Average Seek Distance</th>
                    <th className="pb-3">Boundary Sweep?</th>
                    <th className="pb-3">Service Order Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-border)]">
                  {diskResults.map((res) => {
                    const isMinMove = res.totalHeadMovement === Math.min(...diskResults.map((r) => r.totalHeadMovement));

                    return (
                      <tr key={res.algorithm} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 font-bold text-[var(--text-primary)] flex items-center gap-2">
                          <span>{res.algorithm.replace('_', '-')}</span>
                          {isMinMove && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold flex items-center gap-1 shadow-sm">
                              <Trophy className="w-2.5 h-2.5" />
                              SHORTEST
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-cyan-400 font-bold text-sm">
                          {res.totalHeadMovement} cylinders
                        </td>
                        <td className="py-3 text-[var(--text-secondary)] font-bold">
                          {res.averageMovement} cyl/req
                        </td>
                        <td className="py-3 text-[var(--text-muted)]">
                          {res.algorithm === 'SCAN' || res.algorithm === 'C_SCAN' ? 'Yes (Sweeps to 0/199)' : 'No (Stops at ends)'}
                        </td>
                        <td className="py-3 text-[var(--text-muted)] text-[11px] truncate max-w-xs">
                          {res.serviceOrder.slice(0, 4).join(', ')}...
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MEMORY COMPARISON                                      */}
      {/* ========================================================= */}
      {domain === 'MEMORY' && (
        <div className="space-y-6">
          <div className="glass-panel-elevated rounded-2xl p-6 border border-[var(--glass-border)] space-y-4 shadow-md">
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Dynamic Partitioning Strategy Comparison (Total RAM: 1024 KB)</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--glass-border)] text-[var(--text-secondary)] text-[11px] uppercase">
                    <th className="pb-3">Algorithm</th>
                    <th className="pb-3">Allocated Space</th>
                    <th className="pb-3">Free Space</th>
                    <th className="pb-3">Internal Frag</th>
                    <th className="pb-3">External Frag</th>
                    <th className="pb-3">Utilization %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-border)]">
                  {memResults.map((res) => (
                    <tr key={res.algorithm} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-bold text-[var(--text-primary)]">{res.algorithm.replace('_', ' ')}</td>
                      <td className="py-3 text-cyan-400 font-bold">{res.finalMetrics.allocatedMemory} KB</td>
                      <td className="py-3 text-[var(--text-secondary)]">{res.finalMetrics.freeMemory} KB</td>
                      <td className="py-3 text-[var(--text-muted)]">{res.finalMetrics.internalFragmentation} KB</td>
                      <td className="py-3 text-amber-400 font-bold">{res.finalMetrics.externalFragmentation} KB</td>
                      <td className="py-3 text-emerald-400 font-bold">{res.finalMetrics.utilizationPercentage}%</td>
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
