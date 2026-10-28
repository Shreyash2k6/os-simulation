import { 
  DiskAlgorithm, 
  DiskMovement, 
  DiskStepSnapshot, 
  DiskSimulationConfig, 
  DiskSimulationResult 
} from './types';

export function runDiskScheduler(config: DiskSimulationConfig): DiskSimulationResult {
  const { algorithm, cylinderRange, initialHead, requests, direction } = config;
  const [minCyl, maxCyl] = cylinderRange;

  if (requests.length === 0) {
    throw new Error('At least one disk cylinder request is required.');
  }

  // Validate requests are in range
  for (const r of requests) {
    if (r < minCyl || r > maxCyl) {
      throw new Error(`Request cylinder ${r} is outside range [${minCyl}, ${maxCyl}].`);
    }
  }

  switch (algorithm) {
    case 'FCFS':
      return simulateFCFS(initialHead, requests, cylinderRange);
    case 'SSTF':
      return simulateSSTF(initialHead, requests, cylinderRange);
    case 'SCAN':
      return simulateSCAN(initialHead, requests, cylinderRange, direction);
    case 'C_SCAN':
      return simulateCSCAN(initialHead, requests, cylinderRange, direction);
    case 'LOOK':
      return simulateLOOK(initialHead, requests, cylinderRange, direction);
    case 'C_LOOK':
      return simulateCLOOK(initialHead, requests, cylinderRange, direction);
    default:
      throw new Error(`Unsupported disk scheduling algorithm: ${algorithm}`);
  }
}

function buildResult(
  algorithm: DiskAlgorithm,
  cylinderRange: [number, number],
  initialHead: number,
  headPath: number[],
  serviceOrder: number[],
  movements: DiskMovement[],
  logs: string[]
): DiskSimulationResult {
  const totalMovement = movements.reduce((acc, m) => acc + m.distance, 0);
  const avgMovement = serviceOrder.length > 0 ? Number((totalMovement / serviceOrder.length).toFixed(2)) : 0;

  // Build step-by-step snapshots for reversible playback
  const snapshots: DiskStepSnapshot[] = [];
  let currentHead = initialHead;
  let totalSoFar = 0;
  const visited: number[] = [initialHead];
  let remainingRequests = [...serviceOrder];

  snapshots.push({
    step: 0,
    currentHead: initialHead,
    visitedCylinders: [initialHead],
    pendingRequests: [...serviceOrder],
    totalMovementSoFar: 0,
    lastMovement: null,
    log: `Head initialized at cylinder ${initialHead}.`
  });

  for (let i = 0; i < movements.length; i++) {
    const m = movements[i];
    currentHead = m.to;
    totalSoFar += m.distance;
    visited.push(currentHead);

    if (m.servicedRequest !== undefined) {
      remainingRequests = remainingRequests.filter(r => r !== m.servicedRequest);
    }

    snapshots.push({
      step: i + 1,
      currentHead,
      visitedCylinders: [...visited],
      pendingRequests: [...remainingRequests],
      totalMovementSoFar: totalSoFar,
      lastMovement: m,
      log: m.isCircularWrap 
        ? `Circular wrap from ${m.from} to ${m.to} (Distance: ${m.distance} cylinders).`
        : m.isBoundaryJump
        ? `Head swept to disk boundary ${m.to} (Distance: ${m.distance}).`
        : `Serviced cylinder ${m.to} from ${m.from} (Seek distance: ${m.distance}).`
    });
  }

  return {
    algorithm,
    cylinderRange,
    initialHead,
    serviceOrder,
    headPath,
    movements,
    totalHeadMovement: totalMovement,
    averageMovement: avgMovement,
    snapshots,
    logs
  };
}

// 1. FCFS Disk Simulator
function simulateFCFS(initialHead: number, requests: number[], cylinderRange: [number, number]): DiskSimulationResult {
  const movements: DiskMovement[] = [];
  const logs: string[] = [];
  const path: number[] = [initialHead];
  let head = initialHead;

  for (const req of requests) {
    const dist = Math.abs(req - head);
    movements.push({
      from: head,
      to: req,
      distance: dist,
      servicedRequest: req
    });
    logs.push(`Head moved from ${head} to ${req} (Seek distance: ${dist} cylinders).`);
    head = req;
    path.push(head);
  }

  return buildResult('FCFS', cylinderRange, initialHead, path, requests, movements, logs);
}

// 2. SSTF Disk Simulator
function simulateSSTF(initialHead: number, requests: number[], cylinderRange: [number, number]): DiskSimulationResult {
  const pending = [...requests];
  const movements: DiskMovement[] = [];
  const logs: string[] = [];
  const serviceOrder: number[] = [];
  const path: number[] = [initialHead];
  let head = initialHead;

  while (pending.length > 0) {
    let closestIndex = 0;
    let minSeek = Math.abs(pending[0] - head);

    for (let i = 1; i < pending.length; i++) {
      const seek = Math.abs(pending[i] - head);
      if (seek < minSeek) {
        minSeek = seek;
        closestIndex = i;
      }
    }

    const nextReq = pending.splice(closestIndex, 1)[0];
    movements.push({
      from: head,
      to: nextReq,
      distance: minSeek,
      servicedRequest: nextReq
    });
    serviceOrder.push(nextReq);
    logs.push(`Closest request is cylinder ${nextReq} with seek distance ${minSeek}. Moved ${head} -> ${nextReq}.`);
    head = nextReq;
    path.push(head);
  }

  return buildResult('SSTF', cylinderRange, initialHead, path, serviceOrder, movements, logs);
}

// 3. SCAN (Elevator) Disk Simulator
function simulateSCAN(
  initialHead: number, 
  requests: number[], 
  cylinderRange: [number, number], 
  direction: 'LEFT' | 'RIGHT'
): DiskSimulationResult {
  const [minCyl, maxCyl] = cylinderRange;
  const left = requests.filter(r => r < initialHead).sort((a, b) => b - a); // descending
  const right = requests.filter(r => r >= initialHead).sort((a, b) => a - b); // ascending

  const movements: DiskMovement[] = [];
  const logs: string[] = [];
  const serviceOrder: number[] = [];
  const path: number[] = [initialHead];
  let head = initialHead;

  if (direction === 'RIGHT') {
    // Service right side
    for (const r of right) {
      const dist = Math.abs(r - head);
      movements.push({ from: head, to: r, distance: dist, servicedRequest: r });
      serviceOrder.push(r);
      head = r;
      path.push(head);
    }
    // If there are requests on the left, scan travels to max boundary
    if (left.length > 0) {
      if (head !== maxCyl) {
        const dist = Math.abs(maxCyl - head);
        movements.push({ from: head, to: maxCyl, distance: dist, isBoundaryJump: true });
        head = maxCyl;
        path.push(head);
        logs.push(`SCAN reached end of disk at cylinder ${maxCyl}. Reversing direction.`);
      }
      // Reverse and service left side
      for (const r of left) {
        const dist = Math.abs(r - head);
        movements.push({ from: head, to: r, distance: dist, servicedRequest: r });
        serviceOrder.push(r);
        head = r;
        path.push(head);
      }
    }
  } else {
    // Direction is LEFT
    for (const r of left) {
      const dist = Math.abs(r - head);
      movements.push({ from: head, to: r, distance: dist, servicedRequest: r });
      serviceOrder.push(r);
      head = r;
      path.push(head);
    }
    if (right.length > 0) {
      if (head !== minCyl) {
        const dist = Math.abs(head - minCyl);
        movements.push({ from: head, to: minCyl, distance: dist, isBoundaryJump: true });
        head = minCyl;
        path.push(head);
        logs.push(`SCAN reached start of disk at cylinder ${minCyl}. Reversing direction.`);
      }
      for (const r of right) {
        const dist = Math.abs(r - head);
        movements.push({ from: head, to: r, distance: dist, servicedRequest: r });
        serviceOrder.push(r);
        head = r;
        path.push(head);
      }
    }
  }

  return buildResult('SCAN', cylinderRange, initialHead, path, serviceOrder, movements, logs);
}

// 4. C-SCAN (Circular SCAN)
function simulateCSCAN(
  initialHead: number, 
  requests: number[], 
  cylinderRange: [number, number], 
  direction: 'LEFT' | 'RIGHT'
): DiskSimulationResult {
  const [minCyl, maxCyl] = cylinderRange;
  const left = requests.filter(r => r < initialHead).sort((a, b) => a - b); // ascending
  const right = requests.filter(r => r >= initialHead).sort((a, b) => a - b); // ascending

  const movements: DiskMovement[] = [];
  const logs: string[] = [];
  const serviceOrder: number[] = [];
  const path: number[] = [initialHead];
  let head = initialHead;

  if (direction === 'RIGHT') {
    // Service right side
    for (const r of right) {
      const dist = Math.abs(r - head);
      movements.push({ from: head, to: r, distance: dist, servicedRequest: r });
      serviceOrder.push(r);
      head = r;
      path.push(head);
    }
    if (left.length > 0) {
      // Reach max boundary
      if (head !== maxCyl) {
        const toBoundary = Math.abs(maxCyl - head);
        movements.push({ from: head, to: maxCyl, distance: toBoundary, isBoundaryJump: true });
        head = maxCyl;
        path.push(head);
      }
      // Wrap to min boundary
      const wrapDist = Math.abs(maxCyl - minCyl);
      movements.push({ from: maxCyl, to: minCyl, distance: wrapDist, isCircularWrap: true });
      head = minCyl;
      path.push(head);
      logs.push(`C-SCAN wrapped around from cylinder ${maxCyl} to ${minCyl} (Distance: ${wrapDist}).`);

      // Continue servicing left requests ascending
      for (const r of left) {
        const dist = Math.abs(r - head);
        movements.push({ from: head, to: r, distance: dist, servicedRequest: r });
        serviceOrder.push(r);
        head = r;
        path.push(head);
      }
    }
  } else {
    // Direction LEFT
    const leftDesc = requests.filter(r => r <= initialHead).sort((a, b) => b - a);
    const rightDesc = requests.filter(r => r > initialHead).sort((a, b) => b - a);

    for (const r of leftDesc) {
      const dist = Math.abs(head - r);
      movements.push({ from: head, to: r, distance: dist, servicedRequest: r });
      serviceOrder.push(r);
      head = r;
      path.push(head);
    }
    if (rightDesc.length > 0) {
      if (head !== minCyl) {
        const toMin = Math.abs(head - minCyl);
        movements.push({ from: head, to: minCyl, distance: toMin, isBoundaryJump: true });
        head = minCyl;
        path.push(head);
      }
      const wrapDist = Math.abs(maxCyl - minCyl);
      movements.push({ from: minCyl, to: maxCyl, distance: wrapDist, isCircularWrap: true });
      head = maxCyl;
      path.push(head);

      for (const r of rightDesc) {
        const dist = Math.abs(head - r);
        movements.push({ from: head, to: r, distance: dist, servicedRequest: r });
        serviceOrder.push(r);
        head = r;
        path.push(head);
      }
    }
  }

  return buildResult('C_SCAN', cylinderRange, initialHead, path, serviceOrder, movements, logs);
}

// 5. LOOK Simulator
function simulateLOOK(
  initialHead: number, 
  requests: number[], 
  cylinderRange: [number, number], 
  direction: 'LEFT' | 'RIGHT'
): DiskSimulationResult {
  const left = requests.filter(r => r < initialHead).sort((a, b) => b - a); // descending
  const right = requests.filter(r => r >= initialHead).sort((a, b) => a - b); // ascending

  const movements: DiskMovement[] = [];
  const logs: string[] = [];
  const serviceOrder: number[] = [];
  const path: number[] = [initialHead];
  let head = initialHead;

  if (direction === 'RIGHT') {
    for (const r of right) {
      const dist = Math.abs(r - head);
      movements.push({ from: head, to: r, distance: dist, servicedRequest: r });
      serviceOrder.push(r);
      head = r;
      path.push(head);
    }
    for (const r of left) {
      const dist = Math.abs(r - head);
      movements.push({ from: head, to: r, distance: dist, servicedRequest: r });
      serviceOrder.push(r);
      head = r;
      path.push(head);
    }
  } else {
    for (const r of left) {
      const dist = Math.abs(r - head);
      movements.push({ from: head, to: r, distance: dist, servicedRequest: r });
      serviceOrder.push(r);
      head = r;
      path.push(head);
    }
    for (const r of right) {
      const dist = Math.abs(r - head);
      movements.push({ from: head, to: r, distance: dist, servicedRequest: r });
      serviceOrder.push(r);
      head = r;
      path.push(head);
    }
  }

  return buildResult('LOOK', cylinderRange, initialHead, path, serviceOrder, movements, logs);
}

// 6. C-LOOK Simulator
function simulateCLOOK(
  initialHead: number, 
  requests: number[], 
  cylinderRange: [number, number], 
  direction: 'LEFT' | 'RIGHT'
): DiskSimulationResult {
  const left = requests.filter(r => r < initialHead).sort((a, b) => a - b); // ascending
  const right = requests.filter(r => r >= initialHead).sort((a, b) => a - b); // ascending

  const movements: DiskMovement[] = [];
  const logs: string[] = [];
  const serviceOrder: number[] = [];
  const path: number[] = [initialHead];
  let head = initialHead;

  if (direction === 'RIGHT') {
    for (const r of right) {
      const dist = Math.abs(r - head);
      movements.push({ from: head, to: r, distance: dist, servicedRequest: r });
      serviceOrder.push(r);
      head = r;
      path.push(head);
    }
    if (left.length > 0) {
      // Jump directly to lowest request without touching disk boundaries!
      const lowestReq = left[0];
      const jumpDist = Math.abs(head - lowestReq);
      movements.push({ from: head, to: lowestReq, distance: jumpDist, isCircularWrap: true, servicedRequest: lowestReq });
      serviceOrder.push(lowestReq);
      head = lowestReq;
      path.push(head);
      logs.push(`C-LOOK jumped directly to lowest requested cylinder ${lowestReq} (Distance: ${jumpDist}).`);

      for (let i = 1; i < left.length; i++) {
        const r = left[i];
        const dist = Math.abs(r - head);
        movements.push({ from: head, to: r, distance: dist, servicedRequest: r });
        serviceOrder.push(r);
        head = r;
        path.push(head);
      }
    }
  } else {
    const leftDesc = requests.filter(r => r <= initialHead).sort((a, b) => b - a);
    const rightDesc = requests.filter(r => r > initialHead).sort((a, b) => b - a);

    for (const r of leftDesc) {
      const dist = Math.abs(head - r);
      movements.push({ from: head, to: r, distance: dist, servicedRequest: r });
      serviceOrder.push(r);
      head = r;
      path.push(head);
    }
    if (rightDesc.length > 0) {
      const highestReq = rightDesc[0];
      const jumpDist = Math.abs(highestReq - head);
      movements.push({ from: head, to: highestReq, distance: jumpDist, isCircularWrap: true, servicedRequest: highestReq });
      serviceOrder.push(highestReq);
      head = highestReq;
      path.push(head);

      for (let i = 1; i < rightDesc.length; i++) {
        const r = rightDesc[i];
        const dist = Math.abs(head - r);
        movements.push({ from: head, to: r, distance: dist, servicedRequest: r });
        serviceOrder.push(r);
        head = r;
        path.push(head);
      }
    }
  }

  return buildResult('C_LOOK', cylinderRange, initialHead, path, serviceOrder, movements, logs);
}
