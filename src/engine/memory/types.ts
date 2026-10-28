export type MemoryAlgorithm = 'FIRST_FIT' | 'BEST_FIT' | 'WORST_FIT' | 'FIXED_PARTITIONING' | 'BUDDY_SYSTEM';

export interface MemoryBlock {
  id: string;
  startAddress: number;
  size: number;
  isAllocated: boolean;
  processId?: string;
  internalFragmentation?: number; // for fixed or buddy blocks
  color?: string;
}

export interface MemoryRequest {
  id: string;
  processId: string;
  size: number;
  action: 'ALLOCATE' | 'DEALLOCATE';
}

export interface MemoryMetrics {
  totalMemory: number;
  allocatedMemory: number;
  freeMemory: number;
  internalFragmentation: number;
  externalFragmentation: number;
  largestFreeBlock: number;
  utilizationPercentage: number;
  successfulAllocations: number;
  failedAllocations: number;
}

export interface MemoryStepSnapshot {
  step: number;
  request: MemoryRequest;
  success: boolean;
  reason?: string;
  blocks: MemoryBlock[];
  metrics: MemoryMetrics;
  log: string;
}

export interface MemorySimulationConfig {
  algorithm: MemoryAlgorithm;
  totalMemory: number; // e.g. 1024 KB
  initialPartitions?: number[]; // for Fixed Partitioning, e.g. [100, 200, 300, 424]
  buddyMinBlockSize?: number; // for Buddy system, e.g. 32 KB
  requests: MemoryRequest[];
}

export interface MemorySimulationResult {
  algorithm: MemoryAlgorithm;
  initialBlocks: MemoryBlock[];
  finalBlocks: MemoryBlock[];
  snapshots: MemoryStepSnapshot[];
  finalMetrics: MemoryMetrics;
  logs: string[];
}
