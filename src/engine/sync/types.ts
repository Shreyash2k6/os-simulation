export type SyncProblem = 'PRODUCER_CONSUMER' | 'READERS_WRITERS' | 'DINING_PHILOSOPHERS';

// 1. Producer-Consumer Types
export interface ProducerConsumerState {
  bufferCapacity: number;
  buffer: (string | null)[];
  inPtr: number;
  outPtr: number;
  mutex: number; // 1 or 0
  emptySlots: number;
  fullSlots: number;
  producersWaiting: string[];
  consumersWaiting: string[];
  totalProduced: number;
  totalConsumed: number;
  lastAction?: string;
  ruleExplanation: string;
}

// 2. Readers-Writers Types
export type ReadersWritersPolicy = 'READER_PREFERENCE' | 'WRITER_PREFERENCE' | 'FAIR';

export interface ReadersWritersState {
  policy: ReadersWritersPolicy;
  activeReaders: string[];
  activeWriter: string | null;
  waitingReaders: string[];
  waitingWriters: string[];
  sharedDataVersion: number;
  sharedDataContent: string;
  readerCount: number;
  readLock: boolean;
  writeLock: boolean;
  lastAction?: string;
  ruleExplanation: string;
}

// 3. Dining Philosophers Types
export type DiningPolicy = 'NAIVE_DEADLOCK_PRONE' | 'ASYMMETRIC_RESOURCE_HIERARCHY';
export type PhilosopherStatus = 'THINKING' | 'HUNGRY' | 'EATING';

export interface PhilosopherState {
  id: number;
  name: string;
  status: PhilosopherStatus;
  hasLeftFork: boolean;
  hasRightFork: boolean;
  eatCount: number;
}

export interface DiningPhilosophersState {
  policy: DiningPolicy;
  philosophers: PhilosopherState[];
  forksAvailable: boolean[]; // 5 forks: fork[i] is between philosopher[i] and philosopher[(i+1)%5]
  isDeadlocked: boolean;
  deadlockExplanation: string;
  lastAction?: string;
}
