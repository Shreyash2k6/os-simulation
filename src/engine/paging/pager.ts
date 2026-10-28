import { 
  PagingAlgorithm, 
  PagingSimulationConfig, 
  PagingSimulationResult, 
  PagingStepSnapshot, 
  PagingMetrics, 
  AddressTranslationResult 
} from './types';

export function runPageReplacement(config: PagingSimulationConfig): PagingSimulationResult {
  const { algorithm, referenceString, frameCount } = config;

  if (frameCount <= 0) {
    throw new Error('Frame count must be at least 1.');
  }
  if (!referenceString || referenceString.length === 0) {
    throw new Error('Reference string cannot be empty.');
  }

  switch (algorithm) {
    case 'FIFO':
      return simulateFIFO(referenceString, frameCount);
    case 'LRU':
      return simulateLRU(referenceString, frameCount);
    case 'OPTIMAL':
      return simulateOptimal(referenceString, frameCount);
    default:
      throw new Error(`Unsupported paging algorithm: ${algorithm}`);
  }
}

// 1. FIFO
function simulateFIFO(referenceString: number[], frameCount: number): PagingSimulationResult {
  const frames: (number | null)[] = Array(frameCount).fill(null);
  const fifoQueue: number[] = []; // tracks frame index load order
  const snapshots: PagingStepSnapshot[] = [];
  const logs: string[] = [];
  let pageFaults = 0;
  let pageHits = 0;

  for (let i = 0; i < referenceString.length; i++) {
    const page = referenceString[i];
    const existingIndex = frames.indexOf(page);
    let isHit = false;
    let evictedPage: number | null = null;
    let targetFrameIndex = -1;

    if (existingIndex !== -1) {
      isHit = true;
      pageHits++;
      targetFrameIndex = existingIndex;
      logs.push(`Step ${i + 1}: Page ${page} is already in Frame ${existingIndex} (Page Hit).`);
    } else {
      isHit = false;
      pageFaults++;

      const emptyIndex = frames.indexOf(null);
      if (emptyIndex !== -1) {
        frames[emptyIndex] = page;
        fifoQueue.push(emptyIndex);
        targetFrameIndex = emptyIndex;
        logs.push(`Step ${i + 1}: Page ${page} loaded into empty Frame ${emptyIndex} (Page Fault).`);
      } else {
        // Evict oldest loaded frame
        const evictFrameIndex = fifoQueue.shift()!;
        evictedPage = frames[evictFrameIndex];
        frames[evictFrameIndex] = page;
        fifoQueue.push(evictFrameIndex);
        targetFrameIndex = evictFrameIndex;
        logs.push(`Step ${i + 1}: Page Fault. Evicted Page ${evictedPage} from Frame ${evictFrameIndex}, loaded Page ${page}.`);
      }
    }

    const pageTable: Record<number, number> = {};
    frames.forEach((p, fIdx) => {
      if (p !== null) pageTable[p] = fIdx;
    });

    snapshots.push({
      step: i + 1,
      referencedPage: page,
      frames: [...frames],
      isHit,
      evictedPage,
      loadedPageIndex: targetFrameIndex,
      pageTable,
      log: logs[logs.length - 1]
    });
  }

  const metrics: PagingMetrics = {
    totalReferences: referenceString.length,
    pageHits,
    pageFaults,
    hitRatio: Number(((pageHits / referenceString.length) * 100).toFixed(1)),
    faultRatio: Number(((pageFaults / referenceString.length) * 100).toFixed(1))
  };

  return {
    algorithm: 'FIFO',
    referenceString,
    frameCount,
    snapshots,
    metrics,
    logs
  };
}

// 2. LRU
function simulateLRU(referenceString: number[], frameCount: number): PagingSimulationResult {
  const frames: (number | null)[] = Array(frameCount).fill(null);
  const lastUsed: Record<number, number> = {}; // page -> step index last accessed
  const snapshots: PagingStepSnapshot[] = [];
  const logs: string[] = [];
  let pageFaults = 0;
  let pageHits = 0;

  for (let i = 0; i < referenceString.length; i++) {
    const page = referenceString[i];
    const existingIndex = frames.indexOf(page);
    let isHit = false;
    let evictedPage: number | null = null;
    let targetFrameIndex = -1;

    if (existingIndex !== -1) {
      isHit = true;
      pageHits++;
      lastUsed[page] = i;
      targetFrameIndex = existingIndex;
      logs.push(`Step ${i + 1}: Page ${page} found in Frame ${existingIndex} (Hit, updated last accessed t=${i}).`);
    } else {
      isHit = false;
      pageFaults++;

      const emptyIndex = frames.indexOf(null);
      if (emptyIndex !== -1) {
        frames[emptyIndex] = page;
        lastUsed[page] = i;
        targetFrameIndex = emptyIndex;
        logs.push(`Step ${i + 1}: Page ${page} loaded into empty Frame ${emptyIndex} (Page Fault).`);
      } else {
        // Find the page in frames with minimum lastUsed timestamp
        let oldestPage = frames[0]!;
        let minAccess = lastUsed[oldestPage] ?? -1;
        let evictFrameIndex = 0;

        for (let f = 1; f < frames.length; f++) {
          const p = frames[f]!;
          const access = lastUsed[p] ?? -1;
          if (access < minAccess) {
            minAccess = access;
            oldestPage = p;
            evictFrameIndex = f;
          }
        }

        evictedPage = oldestPage;
        delete lastUsed[oldestPage];
        frames[evictFrameIndex] = page;
        lastUsed[page] = i;
        targetFrameIndex = evictFrameIndex;
        logs.push(`Step ${i + 1}: Page Fault. Evicted least-recently used Page ${evictedPage} (accessed t=${minAccess}) from Frame ${evictFrameIndex}, loaded Page ${page}.`);
      }
    }

    const pageTable: Record<number, number> = {};
    frames.forEach((p, fIdx) => {
      if (p !== null) pageTable[p] = fIdx;
    });

    snapshots.push({
      step: i + 1,
      referencedPage: page,
      frames: [...frames],
      isHit,
      evictedPage,
      loadedPageIndex: targetFrameIndex,
      pageTable,
      log: logs[logs.length - 1]
    });
  }

  const metrics: PagingMetrics = {
    totalReferences: referenceString.length,
    pageHits,
    pageFaults,
    hitRatio: Number(((pageHits / referenceString.length) * 100).toFixed(1)),
    faultRatio: Number(((pageFaults / referenceString.length) * 100).toFixed(1))
  };

  return {
    algorithm: 'LRU',
    referenceString,
    frameCount,
    snapshots,
    metrics,
    logs
  };
}

// 3. Optimal (Belady's Optimal)
function simulateOptimal(referenceString: number[], frameCount: number): PagingSimulationResult {
  const frames: (number | null)[] = Array(frameCount).fill(null);
  const snapshots: PagingStepSnapshot[] = [];
  const logs: string[] = [];
  let pageFaults = 0;
  let pageHits = 0;

  for (let i = 0; i < referenceString.length; i++) {
    const page = referenceString[i];
    const existingIndex = frames.indexOf(page);
    let isHit = false;
    let evictedPage: number | null = null;
    let targetFrameIndex = -1;

    if (existingIndex !== -1) {
      isHit = true;
      pageHits++;
      targetFrameIndex = existingIndex;
      logs.push(`Step ${i + 1}: Page ${page} found in Frame ${existingIndex} (Optimal Hit).`);
    } else {
      isHit = false;
      pageFaults++;

      const emptyIndex = frames.indexOf(null);
      if (emptyIndex !== -1) {
        frames[emptyIndex] = page;
        targetFrameIndex = emptyIndex;
        logs.push(`Step ${i + 1}: Page ${page} loaded into empty Frame ${emptyIndex} (Page Fault).`);
      } else {
        // Find page in frames that will not be used for the longest period in the future
        let farthestIndex = -1;
        let evictFrameIndex = 0;

        for (let f = 0; f < frames.length; f++) {
          const currentPage = frames[f]!;
          let nextUse = -1;

          for (let j = i + 1; j < referenceString.length; j++) {
            if (referenceString[j] === currentPage) {
              nextUse = j;
              break;
            }
          }

          if (nextUse === -1) {
            // Page will never be used again in the future -> ideal eviction candidate
            evictFrameIndex = f;
            break;
          } else if (nextUse > farthestIndex) {
            farthestIndex = nextUse;
            evictFrameIndex = f;
          }
        }

        evictedPage = frames[evictFrameIndex];
        frames[evictFrameIndex] = page;
        targetFrameIndex = evictFrameIndex;
        logs.push(`Step ${i + 1}: Page Fault. Evicted Page ${evictedPage} (longest future use) from Frame ${evictFrameIndex}, loaded Page ${page}.`);
      }
    }

    const pageTable: Record<number, number> = {};
    frames.forEach((p, fIdx) => {
      if (p !== null) pageTable[p] = fIdx;
    });

    snapshots.push({
      step: i + 1,
      referencedPage: page,
      frames: [...frames],
      isHit,
      evictedPage,
      loadedPageIndex: targetFrameIndex,
      pageTable,
      log: logs[logs.length - 1]
    });
  }

  const metrics: PagingMetrics = {
    totalReferences: referenceString.length,
    pageHits,
    pageFaults,
    hitRatio: Number(((pageHits / referenceString.length) * 100).toFixed(1)),
    faultRatio: Number(((pageFaults / referenceString.length) * 100).toFixed(1))
  };

  return {
    algorithm: 'OPTIMAL',
    referenceString,
    frameCount,
    snapshots,
    metrics,
    logs
  };
}

// 4. Logical-to-Physical Address Translation Calculator
export function translateAddress(
  logicalAddress: number,
  pageSize: number,
  pageTable: Record<number, number>
): AddressTranslationResult {
  const pageNumber = Math.floor(logicalAddress / pageSize);
  const offset = logicalAddress % pageSize;
  const frameNumber = pageTable[pageNumber] !== undefined ? pageTable[pageNumber] : null;
  const isPageFault = frameNumber === null;
  const physicalAddress = !isPageFault ? (frameNumber * pageSize + offset) : null;

  // Format binary representations if pageSize is a power of 2
  const isPowerOfTwo = (pageSize & (pageSize - 1)) === 0 && pageSize > 0;
  let binaryRepresentation: AddressTranslationResult['binaryRepresentation'] | undefined;

  if (isPowerOfTwo) {
    const offsetBitsCount = Math.log2(pageSize);
    const logicalBin = logicalAddress.toString(2).padStart(16, '0');
    const offsetBin = offset.toString(2).padStart(offsetBitsCount, '0');
    const pageBin = pageNumber.toString(2);

    let physicalBin: string | undefined;
    if (physicalAddress !== null) {
      physicalBin = physicalAddress.toString(2).padStart(16, '0');
    }

    binaryRepresentation = {
      logical: logicalBin,
      pageBits: pageBin,
      offsetBits: offsetBin,
      physical: physicalBin
    };
  }

  return {
    logicalAddress,
    pageSize,
    pageNumber,
    offset,
    frameNumber,
    physicalAddress,
    isPageFault,
    binaryRepresentation
  };
}
