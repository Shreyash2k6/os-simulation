export interface BankerState {
  processCount: number;
  resourceCount: number;
  resourceNames: string[];
  processes: string[];
  available: number[];
  allocation: number[][]; // [processIndex][resourceIndex]
  max: number[][];        // [processIndex][resourceIndex]
  need: number[][];       // max - allocation
}

export interface BankerStepSnapshot {
  step: number;
  processExamined: string;
  processIndex: number;
  workVector: number[];
  finishVector: boolean[];
  canExecute: boolean;
  reason: string;
  safeSequenceSoFar: string[];
}

export interface BankerResult {
  isSafe: boolean;
  safeSequence: string[];
  needMatrix: number[][];
  steps: BankerStepSnapshot[];
  explanation: string;
}

export interface ResourceRequestEvaluation {
  processId: string;
  request: number[];
  canBeGrantedImmediately: boolean;
  reasons: string[];
  resultingState?: BankerState;
  resultingSafety?: BankerResult;
}

export interface RAGNode {
  id: string;
  name: string;
  type: 'process' | 'resource';
  instances?: number; // for resources
  x?: number;
  y?: number;
}

export interface RAGEdge {
  id: string;
  from: string; // id
  to: string;   // id
  type: 'allocation' | 'request'; // allocation: Resource -> Process; request: Process -> Resource
}

export interface RAGGraph {
  nodes: RAGNode[];
  edges: RAGEdge[];
  hasCycle: boolean;
  cycleNodes: string[];
  isDeadlocked: boolean;
  explanation: string;
}
