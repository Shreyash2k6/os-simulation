export type DiskAlgorithm = 'FCFS' | 'SSTF' | 'SCAN' | 'C_SCAN' | 'LOOK' | 'C_LOOK';

export interface DiskMovement {
  from: number;
  to: number;
  distance: number;
  isBoundaryJump?: boolean;
  isCircularWrap?: boolean;
  servicedRequest?: number;
}

export interface DiskStepSnapshot {
  step: number;
  currentHead: number;
  visitedCylinders: number[];
  pendingRequests: number[];
  totalMovementSoFar: number;
  lastMovement: DiskMovement | null;
  log: string;
}

export interface DiskSimulationConfig {
  algorithm: DiskAlgorithm;
  cylinderRange: [number, number]; // e.g. [0, 199]
  initialHead: number;             // e.g. 50
  requests: number[];              // e.g. [82, 170, 43, 140, 24, 16, 190]
  direction: 'LEFT' | 'RIGHT';     // initial sweep direction
}

export interface DiskSimulationResult {
  algorithm: DiskAlgorithm;
  cylinderRange: [number, number];
  initialHead: number;
  serviceOrder: number[];
  headPath: number[]; // full path including boundaries
  movements: DiskMovement[];
  totalHeadMovement: number;
  averageMovement: number;
  snapshots: DiskStepSnapshot[];
  logs: string[];
}
