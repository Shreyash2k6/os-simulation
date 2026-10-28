export interface ProcessInput {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority: number; // lower number = higher priority or vice-versa (we support standard 1 = highest, configurable)
  color?: string;
}

export interface ProcessMetrics {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
  color: string;
}

export interface GanttBlock {
  processId: string | 'IDLE';
  processName: string;
  startTime: number;
  endTime: number;
  color: string;
  isContextSwitch?: boolean;
}

export interface CPUStepSnapshot {
  step: number;
  currentTime: number;
  runningProcessId: string | 'IDLE' | null;
  readyQueue: string[]; // Process IDs
  completedProcessIds: string[];
  remainingBurstTimes: Record<string, number>;
  ganttBlocks: GanttBlock[];
  log: string;
}

export type CPUSchedulingAlgorithm = 
  | 'FCFS'
  | 'SJF'
  | 'SRTF'
  | 'PRIORITY_NON_PREEMPTIVE'
  | 'PRIORITY_PREEMPTIVE'
  | 'ROUND_ROBIN';

export interface CPUSimulationConfig {
  algorithm: CPUSchedulingAlgorithm;
  processes: ProcessInput[];
  timeQuantum?: number; // for Round Robin
  contextSwitchOverhead?: number; // 0 or fixed ticks
  priorityOrder?: 'LOWEST_FIRST' | 'HIGHEST_FIRST'; // default lowest number = highest priority
}

export interface CPUSimulationResult {
  algorithm: CPUSchedulingAlgorithm;
  timeQuantum?: number;
  metrics: ProcessMetrics[];
  averageTurnaroundTime: number;
  averageWaitingTime: number;
  averageResponseTime: number;
  cpuUtilization: number;
  throughput: number;
  totalTime: number;
  totalContextSwitches: number;
  ganttChart: GanttBlock[];
  snapshots: CPUStepSnapshot[];
  logs: string[];
}
