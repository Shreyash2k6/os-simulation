import { 
  MemoryAlgorithm, 
  MemoryBlock, 
  MemoryRequest, 
  MemoryMetrics, 
  MemoryStepSnapshot, 
  MemorySimulationConfig, 
  MemorySimulationResult 
} from './types';

const PROCESS_COLORS: Record<string, string> = {
  P1: '#4F80FF',
  P2: '#10B981',
  P3: '#8B5CF6',
  P4: '#F59E0B',
  P5: '#F43F5E',
  P6: '#06B6D4',
  P7: '#FB923C',
  P8: '#D946EF'
};

function getProcessColor(processId: string, idx = 0): string {
  if (PROCESS_COLORS[processId]) return PROCESS_COLORS[processId];
  const keys = Object.values(PROCESS_COLORS);
  return keys[idx % keys.length];
}

export function runMemoryAllocator(config: MemorySimulationConfig): MemorySimulationResult {
  const { algorithm, totalMemory, requests, initialPartitions, buddyMinBlockSize = 32 } = config;

  if (algorithm === 'BUDDY_SYSTEM') {
    return simulateBuddySystem(totalMemory, requests, buddyMinBlockSize);
  } else if (algorithm === 'FIXED_PARTITIONING') {
    return simulateFixedPartitioning(totalMemory, initialPartitions || [128, 256, 256, 384], requests);
  } else {
    return simulateDynamicPartitioning(algorithm, totalMemory, requests);
  }
}

function computeMetrics(blocks: MemoryBlock[], totalMemory: number, successCount: number, failCount: number): MemoryMetrics {
  let allocated = 0;
  let freeMem = 0;
  let internalFrag = 0;
  let largestFree = 0;

  for (const b of blocks) {
    if (b.isAllocated) {
      allocated += b.size;
      internalFrag += (b.internalFragmentation || 0);
    } else {
      freeMem += b.size;
      if (b.size > largestFree) {
        largestFree = b.size;
      }
    }
  }

  // External fragmentation occurs when total free memory exists, but the largest contiguous free block is smaller than total free memory
  // A standard operational measurement: free memory that cannot satisfy an allocation when freeMem > largestFree
  const externalFrag = freeMem - largestFree;
  const util = totalMemory > 0 ? (allocated / totalMemory) * 100 : 0;

  return {
    totalMemory,
    allocatedMemory: allocated,
    freeMemory: freeMem,
    internalFragmentation: internalFrag,
    externalFragmentation: Math.max(0, externalFrag),
    largestFreeBlock: largestFree,
    utilizationPercentage: Number(util.toFixed(1)),
    successfulAllocations: successCount,
    failedAllocations: failCount
  };
}

// 1. Dynamic Partitioning (First Fit, Best Fit, Worst Fit)
function simulateDynamicPartitioning(
  algorithm: 'FIRST_FIT' | 'BEST_FIT' | 'WORST_FIT',
  totalMemory: number,
  requests: MemoryRequest[]
): MemorySimulationResult {
  let blocks: MemoryBlock[] = [{
    id: 'block-0',
    startAddress: 0,
    size: totalMemory,
    isAllocated: false
  }];

  const initialBlocks = JSON.parse(JSON.stringify(blocks));
  const snapshots: MemoryStepSnapshot[] = [];
  const logs: string[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];
    let stepSuccess = false;
    let stepReason = '';
    const stepLog = `Step ${i + 1}: ${req.action} ${req.processId} (${req.size} KB)`;

    if (req.action === 'DEALLOCATE') {
      // Find block allocated to this process
      const targetIndex = blocks.findIndex(b => b.isAllocated && b.processId === req.processId);
      if (targetIndex !== -1) {
        blocks[targetIndex].isAllocated = false;
        blocks[targetIndex].processId = undefined;
        blocks[targetIndex].internalFragmentation = 0;
        blocks[targetIndex].color = undefined;
        // Merge adjacent free blocks
        blocks = coalesceAdjacentBlocks(blocks);
        stepSuccess = true;
        stepReason = `Released memory held by ${req.processId}. Coalesced adjacent free segments.`;
      } else {
        stepSuccess = false;
        stepReason = `Process ${req.processId} not currently loaded in memory.`;
      }
    } else {
      // ALLOCATE: find candidate free blocks
      const freeBlocksWithIndices: { block: MemoryBlock; index: number }[] = [];
      blocks.forEach((b, idx) => {
        if (!b.isAllocated && b.size >= req.size) {
          freeBlocksWithIndices.push({ block: b, index: idx });
        }
      });

      if (freeBlocksWithIndices.length === 0) {
        stepSuccess = false;
        failCount++;
        stepReason = `Allocation failed: Insufficient contiguous free space for ${req.size} KB (largest free block: ${Math.max(0, ...blocks.filter(b => !b.isAllocated).map(b => b.size))}).`;
      } else {
        let chosenIndex = -1;

        if (algorithm === 'FIRST_FIT') {
          chosenIndex = freeBlocksWithIndices[0].index;
        } else if (algorithm === 'BEST_FIT') {
          // Smallest block that satisfies size
          freeBlocksWithIndices.sort((a, b) => a.block.size - b.block.size);
          chosenIndex = freeBlocksWithIndices[0].index;
        } else {
          // WORST_FIT: Largest block
          freeBlocksWithIndices.sort((a, b) => b.block.size - a.block.size);
          chosenIndex = freeBlocksWithIndices[0].index;
        }

        const chosenBlock = blocks[chosenIndex];
        const remainingSize = chosenBlock.size - req.size;

        if (remainingSize === 0) {
          chosenBlock.isAllocated = true;
          chosenBlock.processId = req.processId;
          chosenBlock.internalFragmentation = 0;
          chosenBlock.color = getProcessColor(req.processId, i);
        } else {
          // Split block
          const allocatedBlock: MemoryBlock = {
            id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            startAddress: chosenBlock.startAddress,
            size: req.size,
            isAllocated: true,
            processId: req.processId,
            internalFragmentation: 0,
            color: getProcessColor(req.processId, i)
          };
          const freeRemainder: MemoryBlock = {
            id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            startAddress: chosenBlock.startAddress + req.size,
            size: remainingSize,
            isAllocated: false
          };
          blocks.splice(chosenIndex, 1, allocatedBlock, freeRemainder);
        }

        stepSuccess = true;
        successCount++;
        stepReason = `Allocated ${req.size} KB at address ${chosenBlock.startAddress} using ${algorithm.replace('_', ' ')}.`;
      }
    }

    logs.push(`${stepLog} -> ${stepReason}`);
    const metrics = computeMetrics(blocks, totalMemory, successCount, failCount);
    snapshots.push({
      step: i + 1,
      request: req,
      success: stepSuccess,
      reason: stepReason,
      blocks: JSON.parse(JSON.stringify(blocks)),
      metrics,
      log: `${stepLog}: ${stepReason}`
    });
  }

  const finalMetrics = computeMetrics(blocks, totalMemory, successCount, failCount);

  return {
    algorithm,
    initialBlocks,
    finalBlocks: blocks,
    snapshots,
    finalMetrics,
    logs
  };
}

// 2. Fixed Partitioning Simulator
function simulateFixedPartitioning(
  totalMemory: number,
  partitionSizes: number[],
  requests: MemoryRequest[]
): MemorySimulationResult {
  let address = 0;
  let blocks: MemoryBlock[] = partitionSizes.map((size, idx) => {
    const b: MemoryBlock = {
      id: `partition-${idx}`,
      startAddress: address,
      size,
      isAllocated: false,
      internalFragmentation: 0
    };
    address += size;
    return b;
  });

  const initialBlocks = JSON.parse(JSON.stringify(blocks));
  const snapshots: MemoryStepSnapshot[] = [];
  const logs: string[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];
    let stepSuccess = false;
    let stepReason = '';
    const stepLog = `Step ${i + 1}: ${req.action} ${req.processId} (${req.size} KB)`;

    if (req.action === 'DEALLOCATE') {
      const idx = blocks.findIndex(b => b.isAllocated && b.processId === req.processId);
      if (idx !== -1) {
        blocks[idx].isAllocated = false;
        blocks[idx].processId = undefined;
        blocks[idx].internalFragmentation = 0;
        blocks[idx].color = undefined;
        stepSuccess = true;
        stepReason = `Released fixed partition ${idx} from ${req.processId}.`;
      } else {
        stepReason = `Process ${req.processId} not found in any fixed partition.`;
      }
    } else {
      // Find first available partition that fits
      const candidateIdx = blocks.findIndex(b => !b.isAllocated && b.size >= req.size);
      if (candidateIdx === -1) {
        stepSuccess = false;
        failCount++;
        stepReason = `Allocation failed: No free fixed partition >= ${req.size} KB.`;
      } else {
        const b = blocks[candidateIdx];
        b.isAllocated = true;
        b.processId = req.processId;
        b.internalFragmentation = b.size - req.size;
        b.color = getProcessColor(req.processId, i);
        stepSuccess = true;
        successCount++;
        stepReason = `Allocated in partition ${candidateIdx} (${b.size} KB). Internal fragmentation: ${b.internalFragmentation} KB.`;
      }
    }

    logs.push(`${stepLog} -> ${stepReason}`);
    const metrics = computeMetrics(blocks, totalMemory, successCount, failCount);
    snapshots.push({
      step: i + 1,
      request: req,
      success: stepSuccess,
      reason: stepReason,
      blocks: JSON.parse(JSON.stringify(blocks)),
      metrics,
      log: `${stepLog}: ${stepReason}`
    });
  }

  return {
    algorithm: 'FIXED_PARTITIONING',
    initialBlocks,
    finalBlocks: blocks,
    snapshots,
    finalMetrics: computeMetrics(blocks, totalMemory, successCount, failCount),
    logs
  };
}

// 3. Buddy System Simulator
function simulateBuddySystem(
  totalMemory: number,
  requests: MemoryRequest[],
  minBlockSize: number
): MemorySimulationResult {
  // Ensure totalMemory is power of 2
  let powerOfTwoTotal = 1;
  while (powerOfTwoTotal < totalMemory) powerOfTwoTotal *= 2;

  let blocks: MemoryBlock[] = [{
    id: `buddy-0`,
    startAddress: 0,
    size: powerOfTwoTotal,
    isAllocated: false,
    internalFragmentation: 0
  }];

  const initialBlocks = JSON.parse(JSON.stringify(blocks));
  const snapshots: MemoryStepSnapshot[] = [];
  const logs: string[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];
    let stepSuccess = false;
    let stepReason = '';
    const stepLog = `Step ${i + 1}: ${req.action} ${req.processId} (${req.size} KB)`;

    if (req.action === 'DEALLOCATE') {
      const idx = blocks.findIndex(b => b.isAllocated && b.processId === req.processId);
      if (idx !== -1) {
        blocks[idx].isAllocated = false;
        blocks[idx].processId = undefined;
        blocks[idx].internalFragmentation = 0;
        blocks[idx].color = undefined;
        // Recursively merge buddies
        blocks = coalesceBuddies(blocks);
        stepSuccess = true;
        stepReason = `Deallocated ${req.processId} and recursively coalesced buddy pairs.`;
      } else {
        stepReason = `Process ${req.processId} not in memory.`;
      }
    } else {
      // Find smallest power of 2 >= req.size
      let needed = minBlockSize;
      while (needed < req.size) needed *= 2;

      // Find free block of size >= needed
      let chosenIdx = -1;
      let minDifference = Infinity;

      for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
        const b = blocks[bIdx];
        if (!b.isAllocated && b.size >= needed) {
          if (b.size - needed < minDifference) {
            minDifference = b.size - needed;
            chosenIdx = bIdx;
          }
        }
      }

      if (chosenIdx === -1) {
        stepSuccess = false;
        failCount++;
        stepReason = `Buddy allocation failed: No buddy block large enough for ${req.size} KB (needs ${needed} KB power-of-two).`;
      } else {
        // Split repeatedly until size === needed
        while (blocks[chosenIdx].size > needed && blocks[chosenIdx].size / 2 >= minBlockSize) {
          const parent = blocks[chosenIdx];
          const half = parent.size / 2;
          const left: MemoryBlock = {
            id: `buddy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            startAddress: parent.startAddress,
            size: half,
            isAllocated: false
          };
          const right: MemoryBlock = {
            id: `buddy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            startAddress: parent.startAddress + half,
            size: half,
            isAllocated: false
          };
          blocks.splice(chosenIdx, 1, left, right);
          // Keep splitting the left child
        }

        const allocated = blocks[chosenIdx];
        allocated.isAllocated = true;
        allocated.processId = req.processId;
        allocated.internalFragmentation = allocated.size - req.size;
        allocated.color = getProcessColor(req.processId, i);
        stepSuccess = true;
        successCount++;
        stepReason = `Allocated ${req.size} KB into ${allocated.size} KB block. Internal frag: ${allocated.internalFragmentation} KB.`;
      }
    }

    logs.push(`${stepLog} -> ${stepReason}`);
    const metrics = computeMetrics(blocks, powerOfTwoTotal, successCount, failCount);
    snapshots.push({
      step: i + 1,
      request: req,
      success: stepSuccess,
      reason: stepReason,
      blocks: JSON.parse(JSON.stringify(blocks)),
      metrics,
      log: `${stepLog}: ${stepReason}`
    });
  }

  return {
    algorithm: 'BUDDY_SYSTEM',
    initialBlocks,
    finalBlocks: blocks,
    snapshots,
    finalMetrics: computeMetrics(blocks, powerOfTwoTotal, successCount, failCount),
    logs
  };
}

function coalesceAdjacentBlocks(blocks: MemoryBlock[]): MemoryBlock[] {
  if (blocks.length <= 1) return blocks;
  const result: MemoryBlock[] = [];
  let current = { ...blocks[0] };

  for (let i = 1; i < blocks.length; i++) {
    const next = blocks[i];
    if (!current.isAllocated && !next.isAllocated && current.startAddress + current.size === next.startAddress) {
      current.size += next.size;
    } else {
      result.push(current);
      current = { ...next };
    }
  }
  result.push(current);
  return result;
}

function coalesceBuddies(blocks: MemoryBlock[]): MemoryBlock[] {
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < blocks.length - 1; i++) {
      const b1 = blocks[i];
      const b2 = blocks[i + 1];

      // Two blocks are buddies if:
      // 1. Both are free
      // 2. Both have same size
      // 3. (b1.startAddress / b1.size) is even, and b2 starts immediately after b1
      if (!b1.isAllocated && !b2.isAllocated && b1.size === b2.size) {
        if ((b1.startAddress / b1.size) % 2 === 0 && b1.startAddress + b1.size === b2.startAddress) {
          const mergedBlock: MemoryBlock = {
            id: `buddy-merged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            startAddress: b1.startAddress,
            size: b1.size * 2,
            isAllocated: false,
            internalFragmentation: 0
          };
          blocks.splice(i, 2, mergedBlock);
          merged = true;
          break;
        }
      }
    }
  }
  return blocks;
}
