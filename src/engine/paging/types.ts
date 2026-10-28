export type PagingAlgorithm = 'FIFO' | 'LRU' | 'OPTIMAL';

export interface PagingStepSnapshot {
  step: number;
  referencedPage: number;
  frames: (number | null)[];
  isHit: boolean;
  evictedPage: number | null;
  loadedPageIndex: number;
  pageTable: Record<number, number>; // page -> frame index
  log: string;
}

export interface PagingMetrics {
  totalReferences: number;
  pageHits: number;
  pageFaults: number;
  hitRatio: number; // percentage
  faultRatio: number; // percentage
}

export interface PagingSimulationConfig {
  algorithm: PagingAlgorithm;
  referenceString: number[];
  frameCount: number;
}

export interface PagingSimulationResult {
  algorithm: PagingAlgorithm;
  referenceString: number[];
  frameCount: number;
  snapshots: PagingStepSnapshot[];
  metrics: PagingMetrics;
  logs: string[];
}

export interface AddressTranslationResult {
  logicalAddress: number;
  pageSize: number;
  pageNumber: number;
  offset: number;
  frameNumber: number | null;
  physicalAddress: number | null;
  isPageFault: boolean;
  binaryRepresentation?: {
    logical: string;
    pageBits: string;
    offsetBits: string;
    physical?: string;
  };
}
