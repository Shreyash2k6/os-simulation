import { 
  ProducerConsumerState, 
  ReadersWritersState, 
  ReadersWritersPolicy, 
  DiningPhilosophersState, 
  DiningPolicy 
} from './types';

// ==========================================
// 1. PRODUCER - CONSUMER SIMULATOR
// ==========================================
export function createInitialProducerConsumerState(capacity = 5): ProducerConsumerState {
  return {
    bufferCapacity: capacity,
    buffer: Array(capacity).fill(null),
    inPtr: 0,
    outPtr: 0,
    mutex: 1,
    emptySlots: capacity,
    fullSlots: 0,
    producersWaiting: [],
    consumersWaiting: [],
    totalProduced: 0,
    totalConsumed: 0,
    lastAction: 'Initialized bounded buffer.',
    ruleExplanation: 'Semaphore initialized: mutex = 1, empty = N, full = 0.'
  };
}

export function produceItem(state: ProducerConsumerState, producerName = 'Producer'): ProducerConsumerState {
  const next = JSON.parse(JSON.stringify(state)) as ProducerConsumerState;

  // Rule: wait(empty)
  if (next.emptySlots === 0) {
    next.producersWaiting.push(producerName);
    next.lastAction = `${producerName} BLOCKED.`;
    next.ruleExplanation = `wait(empty) failed: Buffer is FULL (${next.fullSlots}/${next.bufferCapacity}). Producer enqueued into semaphore wait list.`;
    return next;
  }

  // Rule: wait(mutex)
  if (next.mutex === 0) {
    next.producersWaiting.push(producerName);
    next.lastAction = `${producerName} BLOCKED by mutex.`;
    next.ruleExplanation = 'wait(mutex) failed: Another process is currently in the critical section.';
    return next;
  }

  // Enter critical section
  next.mutex = 0;
  next.emptySlots -= 1;

  // Insert item
  const itemId = `Item #${next.totalProduced + 1}`;
  next.buffer[next.inPtr] = itemId;
  next.inPtr = (next.inPtr + 1) % next.bufferCapacity;
  next.totalProduced += 1;
  next.fullSlots += 1;

  // Exit critical section: signal(mutex), signal(full)
  next.mutex = 1;

  // Wake up consumer if any was waiting
  if (next.consumersWaiting.length > 0) {
    const unblocked = next.consumersWaiting.shift()!;
    next.ruleExplanation = `Produced "${itemId}". signal(full) awakened waiting ${unblocked}.`;
  } else {
    next.ruleExplanation = `Produced "${itemId}". Slot filled. empty=${next.emptySlots}, full=${next.fullSlots}.`;
  }

  next.lastAction = `${producerName} inserted ${itemId}.`;
  return next;
}

export function consumeItem(state: ProducerConsumerState, consumerName = 'Consumer'): ProducerConsumerState {
  const next = JSON.parse(JSON.stringify(state)) as ProducerConsumerState;

  // Rule: wait(full)
  if (next.fullSlots === 0) {
    next.consumersWaiting.push(consumerName);
    next.lastAction = `${consumerName} BLOCKED.`;
    next.ruleExplanation = `wait(full) failed: Buffer is EMPTY (0/${next.bufferCapacity}). Consumer enqueued into semaphore wait list.`;
    return next;
  }

  // Rule: wait(mutex)
  if (next.mutex === 0) {
    next.consumersWaiting.push(consumerName);
    next.lastAction = `${consumerName} BLOCKED by mutex.`;
    next.ruleExplanation = 'wait(mutex) failed: Critical section currently locked.';
    return next;
  }

  // Enter critical section
  next.mutex = 0;
  next.fullSlots -= 1;

  // Remove item
  const item = next.buffer[next.outPtr];
  next.buffer[next.outPtr] = null;
  next.outPtr = (next.outPtr + 1) % next.bufferCapacity;
  next.totalConsumed += 1;
  next.emptySlots += 1;

  // Exit critical section: signal(mutex), signal(empty)
  next.mutex = 1;

  if (next.producersWaiting.length > 0) {
    const unblocked = next.producersWaiting.shift()!;
    next.ruleExplanation = `Consumed "${item}". signal(empty) released slot and awakened waiting ${unblocked}.`;
  } else {
    next.ruleExplanation = `Consumed "${item}". empty=${next.emptySlots}, full=${next.fullSlots}.`;
  }

  next.lastAction = `${consumerName} removed ${item}.`;
  return next;
}

// ==========================================
// 2. READERS - WRITERS SIMULATOR
// ==========================================
export function createInitialReadersWritersState(policy: ReadersWritersPolicy = 'READER_PREFERENCE'): ReadersWritersState {
  return {
    policy,
    activeReaders: [],
    activeWriter: null,
    waitingReaders: [],
    waitingWriters: [],
    sharedDataVersion: 1,
    sharedDataContent: 'Kernel Config v1.0.0 [Clean System State]',
    readerCount: 0,
    readLock: false,
    writeLock: false,
    lastAction: `Initialized with policy: ${policy.replace('_', ' ')}.`,
    ruleExplanation: 'No active readers or writers. Shared memory accessible.'
  };
}

export function requestRead(state: ReadersWritersState, readerId: string): ReadersWritersState {
  const next = JSON.parse(JSON.stringify(state)) as ReadersWritersState;

  if (next.activeReaders.includes(readerId)) {
    return next;
  }

  // If a writer is currently writing -> must wait
  if (next.activeWriter !== null) {
    next.waitingReaders.push(readerId);
    next.lastAction = `${readerId} queued (Blocked by active writer ${next.activeWriter}).`;
    next.ruleExplanation = `Mutual exclusion rule: Writer ${next.activeWriter} holds exclusive lock. Readers cannot enter.`;
    return next;
  }

  // Under Writer-Preference policy, if writers are queued waiting, new readers must wait to avoid writer starvation!
  if (next.policy === 'WRITER_PREFERENCE' && next.waitingWriters.length > 0) {
    next.waitingReaders.push(readerId);
    next.lastAction = `${readerId} postponed (Writer Preference policy).`;
    next.ruleExplanation = `Writer Preference Policy: ${next.waitingWriters.length} writer(s) are queued. Readers yield priority to prevent writer starvation.`;
    return next;
  }

  // Can read concurrently with other readers
  next.activeReaders.push(readerId);
  next.readerCount += 1;
  next.readLock = true;
  next.lastAction = `${readerId} started reading.`;
  next.ruleExplanation = `Concurrent Read permitted. Active readers: ${next.activeReaders.join(', ')} (${next.readerCount} total).`;
  return next;
}

export function releaseRead(state: ReadersWritersState, readerId: string): ReadersWritersState {
  const next = JSON.parse(JSON.stringify(state)) as ReadersWritersState;
  const idx = next.activeReaders.indexOf(readerId);
  if (idx === -1) return next;

  next.activeReaders.splice(idx, 1);
  next.readerCount -= 1;
  next.lastAction = `${readerId} finished reading.`;

  if (next.readerCount === 0) {
    next.readLock = false;
    // If writers are waiting, wake up the first writer!
    if (next.waitingWriters.length > 0) {
      const nextWriter = next.waitingWriters.shift()!;
      next.activeWriter = nextWriter;
      next.writeLock = true;
      next.ruleExplanation = `Last reader exited. Released rw_mutex -> Writer ${nextWriter} gained exclusive write lock.`;
      return next;
    }
  }

  next.ruleExplanation = `${readerId} exited. ${next.readerCount} reader(s) remain active.`;
  return next;
}

export function requestWrite(state: ReadersWritersState, writerId: string): ReadersWritersState {
  const next = JSON.parse(JSON.stringify(state)) as ReadersWritersState;

  if (next.activeWriter === writerId || next.waitingWriters.includes(writerId)) {
    return next;
  }

  // If any reader is active OR another writer is active, writer must wait
  if (next.activeWriter !== null || next.activeReaders.length > 0) {
    next.waitingWriters.push(writerId);
    next.lastAction = `${writerId} queued (Blocked).`;
    next.ruleExplanation = next.activeWriter 
      ? `Blocked: Another writer (${next.activeWriter}) holds exclusive lock.`
      : `Blocked: ${next.activeReaders.length} reader(s) actively reading. Writer requires exclusive lock.`;
    return next;
  }

  // Writer acquires exclusive lock
  next.activeWriter = writerId;
  next.writeLock = true;
  next.lastAction = `${writerId} gained exclusive write lock.`;
  next.ruleExplanation = `Exclusive lock granted to ${writerId}. All other readers and writers are locked out.`;
  return next;
}

export function releaseWrite(state: ReadersWritersState, newContent?: string): ReadersWritersState {
  const next = JSON.parse(JSON.stringify(state)) as ReadersWritersState;
  if (!next.activeWriter) return next;

  const finishedWriter = next.activeWriter;
  next.activeWriter = null;
  next.writeLock = false;
  next.sharedDataVersion += 1;
  next.sharedDataContent = newContent || `Kernel Data v${next.sharedDataVersion}.0 [Committed by ${finishedWriter}]`;
  next.lastAction = `${finishedWriter} committed update & released lock.`;

  // Wake up queued processes according to policy
  if (next.policy === 'WRITER_PREFERENCE' && next.waitingWriters.length > 0) {
    const nextWriter = next.waitingWriters.shift()!;
    next.activeWriter = nextWriter;
    next.writeLock = true;
    next.ruleExplanation = `Writer-Preference: Handed exclusive lock immediately to next waiting writer ${nextWriter}.`;
  } else if (next.waitingReaders.length > 0) {
    // Wake up all waiting readers
    const waking = [...next.waitingReaders];
    next.waitingReaders = [];
    next.activeReaders.push(...waking);
    next.readerCount += waking.length;
    next.readLock = true;
    next.ruleExplanation = `Writers finished. Woke up all waiting readers: [${waking.join(', ')}].`;
  } else if (next.waitingWriters.length > 0) {
    const nextWriter = next.waitingWriters.shift()!;
    next.activeWriter = nextWriter;
    next.writeLock = true;
    next.ruleExplanation = `Woke up waiting writer ${nextWriter}.`;
  } else {
    next.ruleExplanation = 'All queues clear. Shared resource is currently idle.';
  }

  return next;
}

// ==========================================
// 3. DINING PHILOSOPHERS SIMULATOR
// ==========================================
export function createInitialDiningState(policy: DiningPolicy = 'ASYMMETRIC_RESOURCE_HIERARCHY'): DiningPhilosophersState {
  const names = ['Aristotle', 'Kant', 'Spinoza', 'Russell', 'Turing'];
  const philosophers = names.map((name, i) => ({
    id: i,
    name,
    status: 'THINKING' as const,
    hasLeftFork: false,
    hasRightFork: false,
    eatCount: 0
  }));

  return {
    policy,
    philosophers,
    forksAvailable: [true, true, true, true, true],
    isDeadlocked: false,
    deadlockExplanation: 'System is running normally. No circular wait detected.',
    lastAction: `Initialized 5 philosophers with policy: ${policy.replace('_', ' ')}.`
  };
}

export function togglePhilosopherHunger(state: DiningPhilosophersState, philId: number): DiningPhilosophersState {
  const next = JSON.parse(JSON.stringify(state)) as DiningPhilosophersState;
  const p = next.philosophers[philId];
  const leftFork = philId;
  const rightFork = (philId + 1) % 5;

  if (p.status === 'EATING') {
    // Release both forks and return to THINKING
    next.forksAvailable[leftFork] = true;
    next.forksAvailable[rightFork] = true;
    p.hasLeftFork = false;
    p.hasRightFork = false;
    p.status = 'THINKING';
    next.lastAction = `${p.name} finished eating and released forks #${leftFork} and #${rightFork}.`;
    next.isDeadlocked = false;
    return next;
  }

  if (p.status === 'THINKING') {
    p.status = 'HUNGRY';
    next.lastAction = `${p.name} became hungry.`;

    // Attempt pickup based on policy
    return attemptForkPickup(next, philId);
  }

  if (p.status === 'HUNGRY') {
    // Retry pickup
    return attemptForkPickup(next, philId);
  }

  return next;
}

function attemptForkPickup(state: DiningPhilosophersState, philId: number): DiningPhilosophersState {
  const p = state.philosophers[philId];
  const leftFork = philId;
  const rightFork = (philId + 1) % 5;

  if (state.policy === 'NAIVE_DEADLOCK_PRONE') {
    // Naive rule: pick up left fork first if available, then pick up right fork
    if (!p.hasLeftFork && state.forksAvailable[leftFork]) {
      state.forksAvailable[leftFork] = false;
      p.hasLeftFork = true;
      state.lastAction = `${p.name} acquired left Fork #${leftFork}.`;
    }

    if (p.hasLeftFork && !p.hasRightFork && state.forksAvailable[rightFork]) {
      state.forksAvailable[rightFork] = false;
      p.hasRightFork = true;
      p.status = 'EATING';
      p.eatCount += 1;
      state.lastAction = `${p.name} acquired both forks and started eating!`;
    }

    // Check circular deadlock condition: all 5 hold their left fork and wait for right!
    const allHoldingLeft = state.philosophers.every(ph => ph.hasLeftFork && !ph.hasRightFork);
    if (allHoldingLeft) {
      state.isDeadlocked = true;
      state.deadlockExplanation = 'CIRCULAR WAIT DEADLOCK TRIGGERED! Every philosopher holds their left fork and is waiting indefinitely for their right fork. Mutual exclusion, hold-and-wait, no-preemption, and circular wait are all satisfied.';
    }
  } else {
    // Asymmetric Resource Hierarchy (Dijkstra's solution)
    // Philosophers 0-3 pick min(left, right) first, then max.
    // Philosopher 4 picks max(left, right) first -> breaks circular wait!
    const firstFork = philId === 4 ? rightFork : leftFork;
    const secondFork = philId === 4 ? leftFork : rightFork;

    const canEat = state.forksAvailable[firstFork] && state.forksAvailable[secondFork];
    if (canEat) {
      state.forksAvailable[firstFork] = false;
      state.forksAvailable[secondFork] = false;
      p.hasLeftFork = true;
      p.hasRightFork = true;
      p.status = 'EATING';
      p.eatCount += 1;
      state.lastAction = `${p.name} acquired both forks safely (Resource Hierarchy) and is eating!`;
    } else {
      state.lastAction = `${p.name} is waiting for adjacent forks to become available.`;
    }
    state.isDeadlocked = false;
  }

  return state;
}

// Helper to trigger naive deadlock for educational demo
export function triggerNaiveDeadlock(state: DiningPhilosophersState): DiningPhilosophersState {
  const next = createInitialDiningState('NAIVE_DEADLOCK_PRONE');
  // Have every philosopher pick left fork simultaneously
  for (let i = 0; i < 5; i++) {
    next.philosophers[i].status = 'HUNGRY';
    next.philosophers[i].hasLeftFork = true;
    next.forksAvailable[i] = false;
  }
  next.isDeadlocked = true;
  next.deadlockExplanation = 'CRITICAL DEADLOCK DEMONSTRATION: All 5 philosophers picked up their left fork simultaneously. Since each philosopher needs the right fork held by their neighbor, nobody can proceed. This is the classic circular wait condition.';
  next.lastAction = 'Deadlock triggered: All left forks acquired simultaneously.';
  return next;
}
