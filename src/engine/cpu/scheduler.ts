import { 
  ProcessInput, 
  ProcessMetrics, 
  GanttBlock, 
  CPUStepSnapshot, 
  CPUSchedulingAlgorithm, 
  CPUSimulationConfig, 
  CPUSimulationResult 
} from './types';

export const DEFAULT_PROCESS_COLORS = [
  '#4F80FF', // Electric Indigo Blue
  '#10B981', // Mint Emerald
  '#8B5CF6', // Royal Violet
  '#F59E0B', // Amber Gold
  '#F43F5E', // Vivid Rose
  '#06B6D4', // Cyan Aqua
  '#FB923C', // Coral Orange
  '#D946EF', // Magenta Fuchsia
];

export function validateProcesses(processes: ProcessInput[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!processes || processes.length === 0) {
    errors.push('At least one process is required.');
    return { isValid: false, errors };
  }

  const ids = new Set<string>();
  for (const p of processes) {
    if (!p.id || p.id.trim() === '') {
      errors.push('Each process must have a unique identifier.');
    }
    if (ids.has(p.id)) {
      errors.push(`Duplicate Process ID detected: "${p.id}".`);
    }
    ids.add(p.id);

    if (p.arrivalTime < 0 || !Number.isFinite(p.arrivalTime)) {
      errors.push(`Process ${p.id}: Arrival time must be >= 0.`);
    }
    if (p.burstTime <= 0 || !Number.isFinite(p.burstTime)) {
      errors.push(`Process ${p.id}: Burst time must be a positive number (> 0).`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

export function runCPUScheduler(config: CPUSimulationConfig): CPUSimulationResult {
  const { algorithm, timeQuantum = 2, priorityOrder = 'LOWEST_FIRST' } = config;
  const processes: ProcessInput[] = config.processes.map((p, idx) => ({
    ...p,
    color: p.color || DEFAULT_PROCESS_COLORS[idx % DEFAULT_PROCESS_COLORS.length]
  }));

  const validation = validateProcesses(processes);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(' '));
  }

  switch (algorithm) {
    case 'FCFS':
      return simulateFCFS(processes);
    case 'SJF':
      return simulateSJF(processes);
    case 'SRTF':
      return simulateSRTF(processes);
    case 'PRIORITY_NON_PREEMPTIVE':
      return simulatePriorityNonPreemptive(processes, priorityOrder);
    case 'PRIORITY_PREEMPTIVE':
      return simulatePriorityPreemptive(processes, priorityOrder);
    case 'ROUND_ROBIN':
      return simulateRoundRobin(processes, Math.max(1, timeQuantum));
    default:
      throw new Error(`Unsupported CPU algorithm: ${algorithm}`);
  }
}

// Helper to compute final metrics from execution tracking
function calculateFinalMetrics(
  processes: ProcessInput[],
  completionTimes: Record<string, number>,
  firstResponseTimes: Record<string, number>,
  ganttBlocks: GanttBlock[],
  snapshots: CPUStepSnapshot[],
  logs: string[],
  algorithm: CPUSchedulingAlgorithm,
  timeQuantum?: number
): CPUSimulationResult {
  const metrics: ProcessMetrics[] = processes.map(p => {
    const ct = completionTimes[p.id] ?? 0;
    const tat = ct - p.arrivalTime;
    const wt = tat - p.burstTime;
    const rt = (firstResponseTimes[p.id] ?? p.arrivalTime) - p.arrivalTime;

    return {
      id: p.id,
      name: p.name || p.id,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority,
      completionTime: ct,
      turnaroundTime: Math.max(0, tat),
      waitingTime: Math.max(0, wt),
      responseTime: Math.max(0, rt),
      color: p.color!
    };
  });

  const totalTime = ganttBlocks.length > 0 ? ganttBlocks[ganttBlocks.length - 1].endTime : 0;
  const totalBurstTime = processes.reduce((acc, p) => acc + p.burstTime, 0);

  const avgTAT = metrics.reduce((acc, m) => acc + m.turnaroundTime, 0) / (metrics.length || 1);
  const avgWT = metrics.reduce((acc, m) => acc + m.waitingTime, 0) / (metrics.length || 1);
  const avgRT = metrics.reduce((acc, m) => acc + m.responseTime, 0) / (metrics.length || 1);

  const cpuUtilization = totalTime > 0 ? Math.min(100, (totalBurstTime / totalTime) * 100) : 0;
  const throughput = totalTime > 0 ? processes.length / totalTime : 0;

  // Count context switches (transitions between distinct processes, excluding starting idle)
  let contextSwitches = 0;
  for (let i = 1; i < ganttBlocks.length; i++) {
    const prev = ganttBlocks[i - 1].processId;
    const curr = ganttBlocks[i].processId;
    if (prev !== curr && curr !== 'IDLE' && prev !== 'IDLE') {
      contextSwitches++;
    }
  }

  return {
    algorithm,
    timeQuantum,
    metrics,
    averageTurnaroundTime: Number(avgTAT.toFixed(2)),
    averageWaitingTime: Number(avgWT.toFixed(2)),
    averageResponseTime: Number(avgRT.toFixed(2)),
    cpuUtilization: Number(cpuUtilization.toFixed(1)),
    throughput: Number(throughput.toFixed(3)),
    totalTime,
    totalContextSwitches: contextSwitches,
    ganttChart: ganttBlocks,
    snapshots,
    logs
  };
}

// 1. FCFS Simulator
function simulateFCFS(processes: ProcessInput[]): CPUSimulationResult {
  const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
  const gantt: GanttBlock[] = [];
  const snapshots: CPUStepSnapshot[] = [];
  const logs: string[] = [];
  const completionTimes: Record<string, number> = {};
  const firstResponse: Record<string, number> = {};
  const remainingBurst: Record<string, number> = {};
  processes.forEach(p => { remainingBurst[p.id] = p.burstTime; });

  let currentTime = 0;
  const completed: string[] = [];

  // Snapshot 0
  snapshots.push({
    step: 0,
    currentTime: 0,
    runningProcessId: null,
    readyQueue: sorted.filter(p => p.arrivalTime === 0).map(p => p.id),
    completedProcessIds: [],
    remainingBurstTimes: { ...remainingBurst },
    ganttBlocks: [],
    log: 'Simulation initialized at t=0.'
  });

  for (const proc of sorted) {
    if (currentTime < proc.arrivalTime) {
      // Idle block
      gantt.push({
        processId: 'IDLE',
        processName: 'Idle',
        startTime: currentTime,
        endTime: proc.arrivalTime,
        color: 'rgba(255, 255, 255, 0.1)'
      });
      logs.push(`Time ${currentTime} to ${proc.arrivalTime}: CPU is idle waiting for process arrivals.`);
      currentTime = proc.arrivalTime;
    }

    firstResponse[proc.id] = currentTime;
    const start = currentTime;
    currentTime += proc.burstTime;
    completionTimes[proc.id] = currentTime;
    remainingBurst[proc.id] = 0;
    completed.push(proc.id);

    gantt.push({
      processId: proc.id,
      processName: proc.name || proc.id,
      startTime: start,
      endTime: currentTime,
      color: proc.color!
    });

    logs.push(`Time ${start} to ${currentTime}: Process ${proc.id} dispatched and completed.`);

    const readyNow = sorted.filter(p => p.arrivalTime <= currentTime && !completed.includes(p.id)).map(p => p.id);
    snapshots.push({
      step: snapshots.length,
      currentTime,
      runningProcessId: proc.id,
      readyQueue: readyNow,
      completedProcessIds: [...completed],
      remainingBurstTimes: { ...remainingBurst },
      ganttBlocks: JSON.parse(JSON.stringify(gantt)),
      log: `Process ${proc.id} executed to completion at t=${currentTime}.`
    });
  }

  return calculateFinalMetrics(processes, completionTimes, firstResponse, gantt, snapshots, logs, 'FCFS');
}

// 2. SJF (Non-preemptive) Simulator
function simulateSJF(processes: ProcessInput[]): CPUSimulationResult {
  const gantt: GanttBlock[] = [];
  const snapshots: CPUStepSnapshot[] = [];
  const logs: string[] = [];
  const completionTimes: Record<string, number> = {};
  const firstResponse: Record<string, number> = {};
  const remainingBurst: Record<string, number> = {};
  processes.forEach(p => { remainingBurst[p.id] = p.burstTime; });

  let currentTime = 0;
  const completed: string[] = [];
  const n = processes.length;

  snapshots.push({
    step: 0,
    currentTime: 0,
    runningProcessId: null,
    readyQueue: processes.filter(p => p.arrivalTime <= 0).map(p => p.id),
    completedProcessIds: [],
    remainingBurstTimes: { ...remainingBurst },
    ganttBlocks: [],
    log: 'Simulation initialized at t=0.'
  });

  while (completed.length < n) {
    const readyProcesses = processes.filter(p => p.arrivalTime <= currentTime && !completed.includes(p.id));

    if (readyProcesses.length === 0) {
      // Find the next arrival time
      const nextArrival = Math.min(...processes.filter(p => !completed.includes(p.id)).map(p => p.arrivalTime));
      gantt.push({
        processId: 'IDLE',
        processName: 'Idle',
        startTime: currentTime,
        endTime: nextArrival,
        color: 'rgba(255, 255, 255, 0.1)'
      });
      logs.push(`Time ${currentTime} to ${nextArrival}: CPU idle.`);
      currentTime = nextArrival;
      continue;
    }

    // Pick shortest burst time; tie breaker is arrival time, then id
    readyProcesses.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
    const nextProc = readyProcesses[0];

    firstResponse[nextProc.id] = currentTime;
    const start = currentTime;
    currentTime += nextProc.burstTime;
    completionTimes[nextProc.id] = currentTime;
    remainingBurst[nextProc.id] = 0;
    completed.push(nextProc.id);

    gantt.push({
      processId: nextProc.id,
      processName: nextProc.name || nextProc.id,
      startTime: start,
      endTime: currentTime,
      color: nextProc.color!
    });

    logs.push(`Time ${start} to ${currentTime}: Process ${nextProc.id} (Burst: ${nextProc.burstTime}) ran to completion.`);

    const readyNow = processes.filter(p => p.arrivalTime <= currentTime && !completed.includes(p.id)).map(p => p.id);
    snapshots.push({
      step: snapshots.length,
      currentTime,
      runningProcessId: nextProc.id,
      readyQueue: readyNow,
      completedProcessIds: [...completed],
      remainingBurstTimes: { ...remainingBurst },
      ganttBlocks: JSON.parse(JSON.stringify(gantt)),
      log: `Process ${nextProc.id} executed to completion at t=${currentTime}.`
    });
  }

  return calculateFinalMetrics(processes, completionTimes, firstResponse, gantt, snapshots, logs, 'SJF');
}

// 3. SRTF (Shortest Remaining Time First) Simulator
function simulateSRTF(processes: ProcessInput[]): CPUSimulationResult {
  const gantt: GanttBlock[] = [];
  const snapshots: CPUStepSnapshot[] = [];
  const logs: string[] = [];
  const completionTimes: Record<string, number> = {};
  const firstResponse: Record<string, number> = {};
  const remainingBurst: Record<string, number> = {};
  processes.forEach(p => { remainingBurst[p.id] = p.burstTime; });

  let currentTime = 0;
  const completed: string[] = [];
  const n = processes.length;
  let currentRunningId: string | null = null;
  let blockStart = 0;

  snapshots.push({
    step: 0,
    currentTime: 0,
    runningProcessId: null,
    readyQueue: processes.filter(p => p.arrivalTime <= 0).map(p => p.id),
    completedProcessIds: [],
    remainingBurstTimes: { ...remainingBurst },
    ganttBlocks: [],
    log: 'Simulation initialized at t=0.'
  });

  while (completed.length < n) {
    const ready = processes.filter(p => p.arrivalTime <= currentTime && !completed.includes(p.id));

    if (ready.length === 0) {
      if (currentRunningId !== null) {
        // finish current block
        const proc = processes.find(p => p.id === currentRunningId)!;
        gantt.push({
          processId: currentRunningId,
          processName: proc.name || proc.id,
          startTime: blockStart,
          endTime: currentTime,
          color: proc.color!
        });
        currentRunningId = null;
      }

      const nextArrival = Math.min(...processes.filter(p => !completed.includes(p.id)).map(p => p.arrivalTime));
      gantt.push({
        processId: 'IDLE',
        processName: 'Idle',
        startTime: currentTime,
        endTime: nextArrival,
        color: 'rgba(255, 255, 255, 0.1)'
      });
      currentTime = nextArrival;
      blockStart = currentTime;
      continue;
    }

    // Pick process with minimum remaining burst
    ready.sort((a, b) => remainingBurst[a.id] - remainingBurst[b.id] || a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
    const nextProc = ready[0];

    if (firstResponse[nextProc.id] === undefined) {
      firstResponse[nextProc.id] = currentTime;
    }

    if (currentRunningId !== nextProc.id) {
      if (currentRunningId !== null && currentTime > blockStart) {
        const prevProc = processes.find(p => p.id === currentRunningId)!;
        gantt.push({
          processId: currentRunningId,
          processName: prevProc.name || prevProc.id,
          startTime: blockStart,
          endTime: currentTime,
          color: prevProc.color!
        });
      }
      currentRunningId = nextProc.id;
      blockStart = currentTime;
    }

    // Advance by 1 unit of time
    remainingBurst[nextProc.id] -= 1;
    currentTime += 1;

    if (remainingBurst[nextProc.id] === 0) {
      completionTimes[nextProc.id] = currentTime;
      completed.push(nextProc.id);
      gantt.push({
        processId: nextProc.id,
        processName: nextProc.name || nextProc.id,
        startTime: blockStart,
        endTime: currentTime,
        color: nextProc.color!
      });
      logs.push(`t=${currentTime}: Process ${nextProc.id} completed.`);
      currentRunningId = null;
      blockStart = currentTime;
    }

    const readyNow = processes.filter(p => p.arrivalTime <= currentTime && !completed.includes(p.id)).map(p => p.id);
    snapshots.push({
      step: snapshots.length,
      currentTime,
      runningProcessId: currentRunningId,
      readyQueue: readyNow,
      completedProcessIds: [...completed],
      remainingBurstTimes: { ...remainingBurst },
      ganttBlocks: JSON.parse(JSON.stringify(gantt)),
      log: `At t=${currentTime}, ${currentRunningId ? 'Running ' + currentRunningId : 'Switching'}. Remaining: ${nextProc.id}=${remainingBurst[nextProc.id]}`
    });
  }

  // Merge contiguous gantt blocks for same process if any
  const mergedGantt = mergeAdjacentGantt(gantt);

  return calculateFinalMetrics(processes, completionTimes, firstResponse, mergedGantt, snapshots, logs, 'SRTF');
}

// 4. Priority Non-Preemptive
function simulatePriorityNonPreemptive(processes: ProcessInput[], priorityOrder: 'LOWEST_FIRST' | 'HIGHEST_FIRST'): CPUSimulationResult {
  const gantt: GanttBlock[] = [];
  const snapshots: CPUStepSnapshot[] = [];
  const logs: string[] = [];
  const completionTimes: Record<string, number> = {};
  const firstResponse: Record<string, number> = {};
  const remainingBurst: Record<string, number> = {};
  processes.forEach(p => { remainingBurst[p.id] = p.burstTime; });

  let currentTime = 0;
  const completed: string[] = [];
  const n = processes.length;

  snapshots.push({
    step: 0,
    currentTime: 0,
    runningProcessId: null,
    readyQueue: processes.filter(p => p.arrivalTime <= 0).map(p => p.id),
    completedProcessIds: [],
    remainingBurstTimes: { ...remainingBurst },
    ganttBlocks: [],
    log: 'Simulation initialized at t=0.'
  });

  while (completed.length < n) {
    const ready = processes.filter(p => p.arrivalTime <= currentTime && !completed.includes(p.id));

    if (ready.length === 0) {
      const nextArrival = Math.min(...processes.filter(p => !completed.includes(p.id)).map(p => p.arrivalTime));
      gantt.push({
        processId: 'IDLE',
        processName: 'Idle',
        startTime: currentTime,
        endTime: nextArrival,
        color: 'rgba(255, 255, 255, 0.1)'
      });
      currentTime = nextArrival;
      continue;
    }

    ready.sort((a, b) => {
      const diff = priorityOrder === 'LOWEST_FIRST' ? a.priority - b.priority : b.priority - a.priority;
      return diff !== 0 ? diff : a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id);
    });

    const nextProc = ready[0];
    firstResponse[nextProc.id] = currentTime;
    const start = currentTime;
    currentTime += nextProc.burstTime;
    completionTimes[nextProc.id] = currentTime;
    remainingBurst[nextProc.id] = 0;
    completed.push(nextProc.id);

    gantt.push({
      processId: nextProc.id,
      processName: nextProc.name || nextProc.id,
      startTime: start,
      endTime: currentTime,
      color: nextProc.color!
    });

    logs.push(`Time ${start} to ${currentTime}: Process ${nextProc.id} (Priority: ${nextProc.priority}) completed.`);

    const readyNow = processes.filter(p => p.arrivalTime <= currentTime && !completed.includes(p.id)).map(p => p.id);
    snapshots.push({
      step: snapshots.length,
      currentTime,
      runningProcessId: nextProc.id,
      readyQueue: readyNow,
      completedProcessIds: [...completed],
      remainingBurstTimes: { ...remainingBurst },
      ganttBlocks: JSON.parse(JSON.stringify(gantt)),
      log: `Process ${nextProc.id} (Priority: ${nextProc.priority}) ran to completion.`
    });
  }

  return calculateFinalMetrics(processes, completionTimes, firstResponse, gantt, snapshots, logs, 'PRIORITY_NON_PREEMPTIVE');
}

// 5. Priority Preemptive
function simulatePriorityPreemptive(processes: ProcessInput[], priorityOrder: 'LOWEST_FIRST' | 'HIGHEST_FIRST'): CPUSimulationResult {
  const gantt: GanttBlock[] = [];
  const snapshots: CPUStepSnapshot[] = [];
  const logs: string[] = [];
  const completionTimes: Record<string, number> = {};
  const firstResponse: Record<string, number> = {};
  const remainingBurst: Record<string, number> = {};
  processes.forEach(p => { remainingBurst[p.id] = p.burstTime; });

  let currentTime = 0;
  const completed: string[] = [];
  const n = processes.length;
  let currentRunningId: string | null = null;
  let blockStart = 0;

  snapshots.push({
    step: 0,
    currentTime: 0,
    runningProcessId: null,
    readyQueue: processes.filter(p => p.arrivalTime <= 0).map(p => p.id),
    completedProcessIds: [],
    remainingBurstTimes: { ...remainingBurst },
    ganttBlocks: [],
    log: 'Simulation initialized at t=0.'
  });

  while (completed.length < n) {
    const ready = processes.filter(p => p.arrivalTime <= currentTime && !completed.includes(p.id));

    if (ready.length === 0) {
      if (currentRunningId !== null) {
        const proc = processes.find(p => p.id === currentRunningId)!;
        gantt.push({
          processId: currentRunningId,
          processName: proc.name || proc.id,
          startTime: blockStart,
          endTime: currentTime,
          color: proc.color!
        });
        currentRunningId = null;
      }
      const nextArrival = Math.min(...processes.filter(p => !completed.includes(p.id)).map(p => p.arrivalTime));
      gantt.push({
        processId: 'IDLE',
        processName: 'Idle',
        startTime: currentTime,
        endTime: nextArrival,
        color: 'rgba(255, 255, 255, 0.1)'
      });
      currentTime = nextArrival;
      blockStart = currentTime;
      continue;
    }

    ready.sort((a, b) => {
      const diff = priorityOrder === 'LOWEST_FIRST' ? a.priority - b.priority : b.priority - a.priority;
      return diff !== 0 ? diff : a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id);
    });
    const nextProc = ready[0];

    if (firstResponse[nextProc.id] === undefined) {
      firstResponse[nextProc.id] = currentTime;
    }

    if (currentRunningId !== nextProc.id) {
      if (currentRunningId !== null && currentTime > blockStart) {
        const prev = processes.find(p => p.id === currentRunningId)!;
        gantt.push({
          processId: currentRunningId,
          processName: prev.name || prev.id,
          startTime: blockStart,
          endTime: currentTime,
          color: prev.color!
        });
      }
      currentRunningId = nextProc.id;
      blockStart = currentTime;
    }

    remainingBurst[nextProc.id] -= 1;
    currentTime += 1;

    if (remainingBurst[nextProc.id] === 0) {
      completionTimes[nextProc.id] = currentTime;
      completed.push(nextProc.id);
      gantt.push({
        processId: nextProc.id,
        processName: nextProc.name || nextProc.id,
        startTime: blockStart,
        endTime: currentTime,
        color: nextProc.color!
      });
      logs.push(`t=${currentTime}: Process ${nextProc.id} finished.`);
      currentRunningId = null;
      blockStart = currentTime;
    }

    const readyNow = processes.filter(p => p.arrivalTime <= currentTime && !completed.includes(p.id)).map(p => p.id);
    snapshots.push({
      step: snapshots.length,
      currentTime,
      runningProcessId: currentRunningId,
      readyQueue: readyNow,
      completedProcessIds: [...completed],
      remainingBurstTimes: { ...remainingBurst },
      ganttBlocks: JSON.parse(JSON.stringify(gantt)),
      log: `t=${currentTime}: Active process ${currentRunningId || 'None'} (Priority: ${nextProc.priority})`
    });
  }

  const merged = mergeAdjacentGantt(gantt);
  return calculateFinalMetrics(processes, completionTimes, firstResponse, merged, snapshots, logs, 'PRIORITY_PREEMPTIVE');
}

// 6. Round Robin Simulator
function simulateRoundRobin(processes: ProcessInput[], timeQuantum: number): CPUSimulationResult {
  const gantt: GanttBlock[] = [];
  const snapshots: CPUStepSnapshot[] = [];
  const logs: string[] = [];
  const completionTimes: Record<string, number> = {};
  const firstResponse: Record<string, number> = {};
  const remainingBurst: Record<string, number> = {};
  processes.forEach(p => { remainingBurst[p.id] = p.burstTime; });

  const sortedArrivals = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
  const queue: string[] = [];
  const inQueueOrCompleted = new Set<string>();
  const completed: string[] = [];

  let currentTime = 0;

  // Add initial arrivals at t=0
  for (const p of sortedArrivals) {
    if (p.arrivalTime <= currentTime) {
      queue.push(p.id);
      inQueueOrCompleted.add(p.id);
    }
  }

  snapshots.push({
    step: 0,
    currentTime: 0,
    runningProcessId: null,
    readyQueue: [...queue],
    completedProcessIds: [],
    remainingBurstTimes: { ...remainingBurst },
    ganttBlocks: [],
    log: `Round Robin initialized with Quantum = ${timeQuantum}.`
  });

  while (completed.length < processes.length) {
    if (queue.length === 0) {
      // Find next arriving process
      const unarrived = sortedArrivals.filter(p => !inQueueOrCompleted.has(p.id));
      if (unarrived.length > 0) {
        const nextTime = unarrived[0].arrivalTime;
        gantt.push({
          processId: 'IDLE',
          processName: 'Idle',
          startTime: currentTime,
          endTime: nextTime,
          color: 'rgba(255, 255, 255, 0.1)'
        });
        currentTime = nextTime;
        // Add newly arrived processes
        for (const p of sortedArrivals) {
          if (p.arrivalTime <= currentTime && !inQueueOrCompleted.has(p.id)) {
            queue.push(p.id);
            inQueueOrCompleted.add(p.id);
          }
        }
      } else {
        break;
      }
    }

    const currentId = queue.shift()!;
    const proc = processes.find(p => p.id === currentId)!;

    if (firstResponse[proc.id] === undefined) {
      firstResponse[proc.id] = currentTime;
    }

    const execTime = Math.min(timeQuantum, remainingBurst[proc.id]);
    const start = currentTime;
    currentTime += execTime;
    remainingBurst[proc.id] -= execTime;

    gantt.push({
      processId: proc.id,
      processName: proc.name || proc.id,
      startTime: start,
      endTime: currentTime,
      color: proc.color!
    });

    // Check for new arrivals during this execution interval BEFORE re-enqueuing current process
    for (const p of sortedArrivals) {
      if (p.arrivalTime <= currentTime && !inQueueOrCompleted.has(p.id)) {
        queue.push(p.id);
        inQueueOrCompleted.add(p.id);
      }
    }

    if (remainingBurst[proc.id] === 0) {
      completionTimes[proc.id] = currentTime;
      completed.push(proc.id);
      logs.push(`Time ${start} to ${currentTime}: Process ${proc.id} finished execution.`);
    } else {
      // Re-enqueue for next slice
      queue.push(proc.id);
      logs.push(`Time ${start} to ${currentTime}: Process ${proc.id} executed slice (${execTime}/${timeQuantum}), re-queued.`);
    }

    snapshots.push({
      step: snapshots.length,
      currentTime,
      runningProcessId: proc.id,
      readyQueue: [...queue],
      completedProcessIds: [...completed],
      remainingBurstTimes: { ...remainingBurst },
      ganttBlocks: JSON.parse(JSON.stringify(gantt)),
      log: `Slice completed for ${proc.id} at t=${currentTime}. Remaining burst: ${remainingBurst[proc.id]}`
    });
  }

  return calculateFinalMetrics(processes, completionTimes, firstResponse, gantt, snapshots, logs, 'ROUND_ROBIN', timeQuantum);
}

function mergeAdjacentGantt(blocks: GanttBlock[]): GanttBlock[] {
  if (blocks.length === 0) return [];
  const merged: GanttBlock[] = [{ ...blocks[0] }];

  for (let i = 1; i < blocks.length; i++) {
    const curr = blocks[i];
    const prev = merged[merged.length - 1];

    if (prev.processId === curr.processId && prev.endTime === curr.startTime) {
      prev.endTime = curr.endTime;
    } else {
      merged.push({ ...curr });
    }
  }

  return merged;
}
