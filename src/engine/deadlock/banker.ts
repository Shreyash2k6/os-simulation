import { 
  BankerState, 
  BankerResult, 
  BankerStepSnapshot, 
  ResourceRequestEvaluation, 
  RAGGraph 
} from './types';

export const DEFAULT_BANKER_STATE: BankerState = {
  processCount: 5,
  resourceCount: 3,
  resourceNames: ['A', 'B', 'C'],
  processes: ['P0', 'P1', 'P2', 'P3', 'P4'],
  available: [3, 3, 2],
  allocation: [
    [0, 1, 0], // P0
    [2, 0, 0], // P1
    [3, 0, 2], // P2
    [2, 1, 1], // P3
    [0, 0, 2]  // P4
  ],
  max: [
    [7, 5, 3], // P0
    [3, 2, 2], // P1
    [9, 0, 2], // P2
    [2, 2, 2], // P3
    [4, 3, 3]  // P4
  ],
  need: [
    [7, 4, 3], // P0
    [1, 2, 2], // P1
    [6, 0, 0], // P2
    [0, 1, 1], // P3
    [4, 3, 1]  // P4
  ]
};

export function calculateNeedMatrix(max: number[][], allocation: number[][]): number[][] {
  const need: number[][] = [];
  for (let i = 0; i < max.length; i++) {
    need[i] = [];
    for (let j = 0; j < max[i].length; j++) {
      need[i][j] = Math.max(0, max[i][j] - allocation[i][j]);
    }
  }
  return need;
}

// Check Safety Algorithm: returns whether system is in a safe state and ordered sequence
export function runBankersAlgorithm(state: BankerState): BankerResult {
  const { processCount, resourceCount, processes, available, allocation, max } = state;
  const need = calculateNeedMatrix(max, allocation);

  const work = [...available];
  const finish = Array(processCount).fill(false);
  const safeSequence: string[] = [];
  const steps: BankerStepSnapshot[] = [];

  let count = 0;
  let changed = true;

  while (count < processCount && changed) {
    changed = false;

    for (let i = 0; i < processCount; i++) {
      if (!finish[i]) {
        // Check if Need_i <= Work
        let canAllocate = true;
        for (let j = 0; j < resourceCount; j++) {
          if (need[i][j] > work[j]) {
            canAllocate = false;
            break;
          }
        }

        if (canAllocate) {
          // Process can complete! Reclaim its allocated resources
          for (let j = 0; j < resourceCount; j++) {
            work[j] += allocation[i][j];
          }
          finish[i] = true;
          safeSequence.push(processes[i]);
          changed = true;
          count++;

          steps.push({
            step: steps.length + 1,
            processExamined: processes[i],
            processIndex: i,
            workVector: [...work],
            finishVector: [...finish],
            canExecute: true,
            reason: `Need (${need[i].join(', ')}) <= Work (${work.map((w, idx) => w - allocation[i][idx]).join(', ')}). ${processes[i]} completes and releases allocation (${allocation[i].join(', ')}). New Work: [${work.join(', ')}].`,
            safeSequenceSoFar: [...safeSequence]
          });
        } else {
          // Cannot execute yet
          steps.push({
            step: steps.length + 1,
            processExamined: processes[i],
            processIndex: i,
            workVector: [...work],
            finishVector: [...finish],
            canExecute: false,
            reason: `Need (${need[i].join(', ')}) > Work (${work.join(', ')}). Process ${processes[i]} must wait.`,
            safeSequenceSoFar: [...safeSequence]
          });
        }
      }
    }
  }

  const isSafe = count === processCount;
  const explanation = isSafe 
    ? `System is in a SAFE STATE. A valid execution order avoiding deadlock is < ${safeSequence.join(' -> ')} >.`
    : `System is in an UNSAFE STATE. Cannot satisfy all process maximum claims without risk of circular wait/deadlock. (Unsafe state != immediate deadlock, but safety is not guaranteed).`;

  return {
    isSafe,
    safeSequence,
    needMatrix: need,
    steps,
    explanation
  };
}

// Resource-Request Algorithm: tests if a specific request from Pi can be granted immediately
export function evaluateResourceRequest(
  state: BankerState,
  processIndex: number,
  request: number[]
): ResourceRequestEvaluation {
  const pName = state.processes[processIndex];
  const need = calculateNeedMatrix(state.max, state.allocation);
  const reasons: string[] = [];

  // Check 1: Request <= Need
  for (let j = 0; j < state.resourceCount; j++) {
    if (request[j] > need[processIndex][j]) {
      reasons.push(`Error: Process ${pName} has requested more instances of ${state.resourceNames[j]} (${request[j]}) than its declared maximum remaining need (${need[processIndex][j]}). Claim exceeded!`);
      return {
        processId: pName,
        request,
        canBeGrantedImmediately: false,
        reasons
      };
    }
  }

  // Check 2: Request <= Available
  for (let j = 0; j < state.resourceCount; j++) {
    if (request[j] > state.available[j]) {
      reasons.push(`Process ${pName} must wait: Resource ${state.resourceNames[j]} requested (${request[j]}) exceeds currently available stock (${state.available[j]}).`);
      return {
        processId: pName,
        request,
        canBeGrantedImmediately: false,
        reasons
      };
    }
  }

  // Step 3: Tentatively allocate resources
  const tentativeAvailable = state.available.map((a, j) => a - request[j]);
  const tentativeAllocation = state.allocation.map((row, i) => 
    i === processIndex ? row.map((val, j) => val + request[j]) : [...row]
  );

  const tentativeState: BankerState = {
    ...state,
    available: tentativeAvailable,
    allocation: tentativeAllocation,
    need: calculateNeedMatrix(state.max, tentativeAllocation)
  };

  // Run safety algorithm on tentative state
  const safety = runBankersAlgorithm(tentativeState);

  if (safety.isSafe) {
    reasons.push(`Request can be GRANTED IMMEDIATELY. Granting leaves the system in a SAFE state with safe sequence: < ${safety.safeSequence.join(' -> ')} >.`);
    return {
      processId: pName,
      request,
      canBeGrantedImmediately: true,
      reasons,
      resultingState: tentativeState,
      resultingSafety: safety
    };
  } else {
    reasons.push(`Request MUST BE DENIED / POSTPONED. Granting would lead the system into an UNSAFE STATE. Process ${pName} must wait to preserve deadlock avoidance.`);
    return {
      processId: pName,
      request,
      canBeGrantedImmediately: false,
      reasons,
      resultingState: tentativeState,
      resultingSafety: safety
    };
  }
}

// Resource Allocation Graph Cycle Detection (Tarjan / DFS)
export function analyzeRAG(graph: RAGGraph): RAGGraph {
  const adj = new Map<string, string[]>();
  graph.nodes.forEach(n => adj.set(n.id, []));

  graph.edges.forEach(e => {
    if (adj.has(e.from)) {
      adj.get(e.from)!.push(e.to);
    }
  });

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycleNodes: string[] = [];
  let hasCycle = false;

  function dfs(nodeId: string, path: string[]): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adj.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, [...path])) return true;
      } else if (recStack.has(neighbor)) {
        hasCycle = true;
        const cycleStartIndex = path.indexOf(neighbor);
        const cycleSlice = path.slice(cycleStartIndex);
        cycleSlice.forEach(n => cycleNodes.push(n));
        return true;
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id, [])) break;
    }
  }

  // If single-instance resources and cycle exists -> Deadlock!
  // If multiple instances -> cycle is necessary condition, but not sufficient
  const singleInstanceOnly = graph.nodes.filter(n => n.type === 'resource').every(n => (n.instances || 1) === 1);
  const isDeadlocked = hasCycle && singleInstanceOnly;

  let explanation = 'No circular wait cycles detected in Resource Allocation Graph. System is deadlock-free.';
  if (hasCycle) {
    if (singleInstanceOnly) {
      explanation = `DEADLOCK DETECTED! A circular wait cycle exists involving nodes [${Array.from(new Set(cycleNodes)).join(', ')}]. With single-instance resources, a cycle is necessary and sufficient for deadlock.`;
    } else {
      explanation = `CYCLE DETECTED among nodes [${Array.from(new Set(cycleNodes)).join(', ')}]. Note: Since some resources have multiple instances, a cycle is a necessary condition, but may not be an immediate deadlock if other processes release instances.`;
    }
  }

  return {
    ...graph,
    hasCycle,
    cycleNodes: Array.from(new Set(cycleNodes)),
    isDeadlocked,
    explanation
  };
}
