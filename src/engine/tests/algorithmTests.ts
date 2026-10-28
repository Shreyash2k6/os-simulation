import { runCPUScheduler } from '../cpu/scheduler';
import { runMemoryAllocator } from '../memory/allocator';
import { runPageReplacement } from '../paging/pager';
import { runBankersAlgorithm } from '../deadlock/banker';
import { runDiskScheduler } from '../disk/diskScheduler';
import { translateSegmentAddress, DEFAULT_SEGMENTS } from '../segmentation/segmenter';

export interface TestResultItem {
  id: string;
  domain: string;
  title: string;
  expected: string;
  actual: string;
  passed: boolean;
  notes?: string;
}

export function runAllAutomatedAlgorithmTests(): TestResultItem[] {
  const results: TestResultItem[] = [];

  // 1. CPU FCFS Standard Textbook Test
  try {
    const fcfsRes = runCPUScheduler({
      algorithm: 'FCFS',
      processes: [
        { id: 'P1', name: 'P1', arrivalTime: 0, burstTime: 24, priority: 1 },
        { id: 'P2', name: 'P2', arrivalTime: 0, burstTime: 3, priority: 1 },
        { id: 'P3', name: 'P3', arrivalTime: 0, burstTime: 3, priority: 1 }
      ]
    });
    // Expected: P1 completion 24, P2 completion 27, P3 completion 30
    // Waiting times: P1=0, P2=24, P3=27 -> Avg WT = (0+24+27)/3 = 17.0
    const avgWT = fcfsRes.averageWaitingTime;
    results.push({
      id: 'cpu-fcfs-1',
      domain: 'CPU Scheduling',
      title: 'FCFS Textbook Case (P1:24, P2:3, P3:3 arriving at t=0)',
      expected: 'Average Waiting Time = 17.0',
      actual: `Average Waiting Time = ${avgWT}`,
      passed: avgWT === 17.0
    });
  } catch (err: any) {
    results.push({
      id: 'cpu-fcfs-1',
      domain: 'CPU Scheduling',
      title: 'FCFS Textbook Case',
      expected: 'Average Waiting Time = 17.0',
      actual: `Error: ${err.message}`,
      passed: false
    });
  }

  // 2. CPU Round Robin Test (Quantum = 2)
  try {
    const rrRes = runCPUScheduler({
      algorithm: 'ROUND_ROBIN',
      timeQuantum: 2,
      processes: [
        { id: 'P1', name: 'P1', arrivalTime: 0, burstTime: 5, priority: 1 },
        { id: 'P2', name: 'P2', arrivalTime: 0, burstTime: 3, priority: 1 },
        { id: 'P3', name: 'P3', arrivalTime: 0, burstTime: 1, priority: 1 }
      ]
    });
    // Total execution time should equal sum of bursts = 5 + 3 + 1 = 9
    results.push({
      id: 'cpu-rr-1',
      domain: 'CPU Scheduling',
      title: 'Round Robin Conservation of CPU Time',
      expected: 'Total Time = 9',
      actual: `Total Time = ${rrRes.totalTime}`,
      passed: rrRes.totalTime === 9
    });
  } catch (err: any) {
    results.push({
      id: 'cpu-rr-1',
      domain: 'CPU Scheduling',
      title: 'Round Robin Conservation',
      expected: 'Total Time = 9',
      actual: `Error: ${err.message}`,
      passed: false
    });
  }

  // 3. Memory First Fit vs Best Fit on Fragmentation
  try {
    const memRes = runMemoryAllocator({
      algorithm: 'FIRST_FIT',
      totalMemory: 500,
      requests: [
        { id: 'r1', processId: 'P1', size: 100, action: 'ALLOCATE' },
        { id: 'r2', processId: 'P2', size: 200, action: 'ALLOCATE' },
        { id: 'r3', processId: 'P1', size: 100, action: 'DEALLOCATE' },
        { id: 'r4', processId: 'P3', size: 80, action: 'ALLOCATE' }
      ]
    });
    // P3 should be allocated in the 100 block freed by P1
    const p3Alloc = memRes.finalBlocks.find(b => b.processId === 'P3');
    results.push({
      id: 'mem-firstfit-1',
      domain: 'Memory Allocation',
      title: 'First Fit Reallocation after Deallocation',
      expected: 'P3 allocated at address 0 (size 80)',
      actual: `P3 at address ${p3Alloc?.startAddress} (size ${p3Alloc?.size})`,
      passed: p3Alloc?.startAddress === 0 && p3Alloc?.size === 80
    });
  } catch (err: any) {
    results.push({
      id: 'mem-firstfit-1',
      domain: 'Memory Allocation',
      title: 'First Fit Reallocation',
      expected: 'P3 allocated at address 0',
      actual: `Error: ${err.message}`,
      passed: false
    });
  }

  // 4. Memory Buddy System Split & Merge
  try {
    const buddyRes = runMemoryAllocator({
      algorithm: 'BUDDY_SYSTEM',
      totalMemory: 512,
      buddyMinBlockSize: 32,
      requests: [
        { id: 'r1', processId: 'A', size: 100, action: 'ALLOCATE' }, // needs 128
        { id: 'r2', processId: 'A', size: 100, action: 'DEALLOCATE' }  // should merge back to 512
      ]
    });
    const finalBlockCount = buddyRes.finalBlocks.length;
    const finalSize = buddyRes.finalBlocks[0]?.size;
    results.push({
      id: 'mem-buddy-1',
      domain: 'Memory Allocation',
      title: 'Buddy System Recursive Coalescing',
      expected: '1 free block of 512 KB restored',
      actual: `${finalBlockCount} block(s), size = ${finalSize} KB`,
      passed: finalBlockCount === 1 && finalSize === 512
    });
  } catch (err: any) {
    results.push({
      id: 'mem-buddy-1',
      domain: 'Memory Allocation',
      title: 'Buddy System Recursive Coalescing',
      expected: '1 free block of 512 KB',
      actual: `Error: ${err.message}`,
      passed: false
    });
  }

  // 5. Paging FIFO Reference String Test (3 frames)
  try {
    // Reference string: 7, 0, 1, 2, 0, 3, 0, 4, 2, 3
    const fifoRes = runPageReplacement({
      algorithm: 'FIFO',
      referenceString: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3],
      frameCount: 3
    });
    // Standard textbook verification: 9 faults out of 10 references
    results.push({
      id: 'paging-fifo-1',
      domain: 'Paging',
      title: 'FIFO Page Replacement (10 refs, 3 frames)',
      expected: 'Page Faults = 9',
      actual: `Page Faults = ${fifoRes.metrics.pageFaults}`,
      passed: fifoRes.metrics.pageFaults === 9
    });
  } catch (err: any) {
    results.push({
      id: 'paging-fifo-1',
      domain: 'Paging',
      title: 'FIFO Page Replacement',
      expected: 'Page Faults = 9',
      actual: `Error: ${err.message}`,
      passed: false
    });
  }

  // 6. Paging Optimal is <= FIFO in Fault Count
  try {
    const optRes = runPageReplacement({
      algorithm: 'OPTIMAL',
      referenceString: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3],
      frameCount: 3
    });
    // Optimal benchmark has 7 page faults
    results.push({
      id: 'paging-opt-1',
      domain: 'Paging',
      title: 'Optimal Page Replacement Benchmark',
      expected: 'Page Faults = 7',
      actual: `Page Faults = ${optRes.metrics.pageFaults}`,
      passed: optRes.metrics.pageFaults === 7
    });
  } catch (err: any) {
    results.push({
      id: 'paging-opt-1',
      domain: 'Paging',
      title: 'Optimal Benchmark',
      expected: 'Page Faults = 7',
      actual: `Error: ${err.message}`,
      passed: false
    });
  }

  // 7. Segmentation Fault Detection
  try {
    const segRes = translateSegmentAddress(0, 1200, DEFAULT_SEGMENTS); // Segment 0 limit is 1000
    results.push({
      id: 'seg-fault-1',
      domain: 'Segmentation',
      title: 'Segmentation Fault on Offset >= Limit',
      expected: 'isSegmentationFault = true',
      actual: `isSegmentationFault = ${segRes.isSegmentationFault}`,
      passed: segRes.isSegmentationFault === true
    });
  } catch (err: any) {
    results.push({
      id: 'seg-fault-1',
      domain: 'Segmentation',
      title: 'Segmentation Fault Check',
      expected: 'isSegmentationFault = true',
      actual: `Error: ${err.message}`,
      passed: false
    });
  }

  // 8. Banker's Algorithm Safe State Verification
  try {
    const bankerRes = runBankersAlgorithm({
      processCount: 5,
      resourceCount: 3,
      resourceNames: ['A', 'B', 'C'],
      processes: ['P0', 'P1', 'P2', 'P3', 'P4'],
      available: [3, 3, 2],
      allocation: [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2]
      ],
      max: [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3]
      ],
      need: []
    });
    // Should be in safe state with sequence of length 5
    results.push({
      id: 'banker-safe-1',
      domain: 'Deadlock & Banker',
      title: 'Banker\'s Safety Algorithm (Silberschatz Reference State)',
      expected: 'isSafe = true, 5 processes sequenced',
      actual: `isSafe = ${bankerRes.isSafe}, sequence = < ${bankerRes.safeSequence.join(', ')} >`,
      passed: bankerRes.isSafe && bankerRes.safeSequence.length === 5
    });
  } catch (err: any) {
    results.push({
      id: 'banker-safe-1',
      domain: 'Deadlock & Banker',
      title: 'Banker\'s Safety Check',
      expected: 'isSafe = true',
      actual: `Error: ${err.message}`,
      passed: false
    });
  }

  // 9. Disk FCFS Standard Reference Case
  try {
    // Initial head = 53, queue = [98, 183, 37, 122, 14, 124, 65, 67]
    // Total head movements = |98-53| + |183-98| + |37-183| + |122-37| + |14-122| + |124-14| + |65-124| + |67-65|
    // 45 + 85 + 146 + 85 + 108 + 110 + 59 + 2 = 640
    const diskFcfs = runDiskScheduler({
      algorithm: 'FCFS',
      cylinderRange: [0, 199],
      initialHead: 53,
      requests: [98, 183, 37, 122, 14, 124, 65, 67],
      direction: 'RIGHT'
    });
    results.push({
      id: 'disk-fcfs-1',
      domain: 'Disk Scheduling',
      title: 'Disk FCFS Textbook Benchmark (Head=53)',
      expected: 'Total Head Movement = 640',
      actual: `Total Head Movement = ${diskFcfs.totalHeadMovement}`,
      passed: diskFcfs.totalHeadMovement === 640
    });
  } catch (err: any) {
    results.push({
      id: 'disk-fcfs-1',
      domain: 'Disk Scheduling',
      title: 'Disk FCFS Benchmark',
      expected: 'Total Head Movement = 640',
      actual: `Error: ${err.message}`,
      passed: false
    });
  }

  // 10. Disk SSTF Standard Reference Case
  try {
    // Head = 53, queue = [98, 183, 37, 122, 14, 124, 65, 67]
    // Order: 65, 67, 37, 14, 98, 122, 124, 183 -> Total movement = 236
    const diskSstf = runDiskScheduler({
      algorithm: 'SSTF',
      cylinderRange: [0, 199],
      initialHead: 53,
      requests: [98, 183, 37, 122, 14, 124, 65, 67],
      direction: 'RIGHT'
    });
    results.push({
      id: 'disk-sstf-1',
      domain: 'Disk Scheduling',
      title: 'Disk SSTF Benchmark (Head=53)',
      expected: 'Total Head Movement = 236',
      actual: `Total Head Movement = ${diskSstf.totalHeadMovement}`,
      passed: diskSstf.totalHeadMovement === 236
    });
  } catch (err: any) {
    results.push({
      id: 'disk-sstf-1',
      domain: 'Disk Scheduling',
      title: 'Disk SSTF Benchmark',
      expected: 'Total Head Movement = 236',
      actual: `Error: ${err.message}`,
      passed: false
    });
  }

  return results;
}
