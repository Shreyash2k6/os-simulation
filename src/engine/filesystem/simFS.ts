import { FileAllocationMethod, DiskBlock, VirtualFile, VirtualDirectory, FileSystemState } from './types';

const FILE_COLORS = [
  '#4F80FF',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#F43F5E',
  '#06B6D4',
  '#FB923C',
  '#D946EF'
];

export function createInitialFileSystem(totalBlocks = 64, blockSize = 512, method: FileAllocationMethod = 'INDEXED'): FileSystemState {
  const blocks: DiskBlock[] = Array.from({ length: totalBlocks }, (_, i) => ({
    blockNumber: i,
    isAllocated: false
  }));

  const rootDir: VirtualDirectory = {
    id: 'root',
    name: '/',
    parentDirId: null,
    createdAt: new Date().toISOString()
  };

  const docsDir: VirtualDirectory = {
    id: 'dir-docs',
    name: 'docs',
    parentDirId: 'root',
    createdAt: new Date().toISOString()
  };

  const sysDir: VirtualDirectory = {
    id: 'dir-sys',
    name: 'system',
    parentDirId: 'root',
    createdAt: new Date().toISOString()
  };

  let state: FileSystemState = {
    totalBlocks,
    blockSizeBytes: blockSize,
    allocationMethod: method,
    blocks,
    files: [],
    directories: [rootDir, docsDir, sysDir],
    currentDirId: 'root',
    log: ['Virtual File System initialized with 64 blocks of 512 bytes each.']
  };

  // Seed with 2 demo files
  state = createFile(state, 'kernel.sys', 'dir-sys', 1024, 'OS Kernel Core binary image and descriptor table.', method);
  state = createFile(state, 'readme.txt', 'root', 450, 'Welcome to the OS Lab Simulated File System! All operations execute on virtual storage.', method);

  return state;
}

export function createFile(
  state: FileSystemState,
  fileName: string,
  parentDirId: string,
  sizeBytes: number,
  content: string,
  method = state.allocationMethod
): FileSystemState {
  const next = JSON.parse(JSON.stringify(state)) as FileSystemState;
  const blocksNeeded = Math.max(1, Math.ceil(sizeBytes / next.blockSizeBytes));
  const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const color = FILE_COLORS[next.files.length % FILE_COLORS.length];

  if (method === 'CONTIGUOUS') {
    // Find contiguous span of free blocks
    let startIdx = -1;
    let span = 0;

    for (let i = 0; i < next.blocks.length; i++) {
      if (!next.blocks[i].isAllocated) {
        if (span === 0) startIdx = i;
        span++;
        if (span === blocksNeeded) break;
      } else {
        span = 0;
        startIdx = -1;
      }
    }

    if (span < blocksNeeded) {
      next.log.push(`Error: Insufficient contiguous free blocks (${blocksNeeded} blocks requested). Disk compaction or defragmentation required.`);
      return next;
    }

    const allocatedBlocks: number[] = [];
    for (let i = startIdx; i < startIdx + blocksNeeded; i++) {
      next.blocks[i].isAllocated = true;
      next.blocks[i].fileId = fileId;
      next.blocks[i].fileName = fileName;
      next.blocks[i].color = color;
      allocatedBlocks.push(i);
    }

    const newFile: VirtualFile = {
      id: fileId,
      name: fileName,
      parentDirId,
      sizeBytes,
      blocksNeeded,
      allocationMethod: 'CONTIGUOUS',
      allocatedBlocks,
      startBlock: startIdx,
      lengthBlocks: blocksNeeded,
      content,
      createdAt: new Date().toLocaleTimeString(),
      modifiedAt: new Date().toLocaleTimeString(),
      color
    };

    next.files.push(newFile);
    next.log.push(`Contiguous File "${fileName}" created: [Start: Block ${startIdx}, Length: ${blocksNeeded}]. Blocks: [${allocatedBlocks.join(', ')}].`);
    return next;

  } else if (method === 'LINKED') {
    const freeIndices = next.blocks.map((b, i) => (!b.isAllocated ? i : -1)).filter(i => i !== -1);
    if (freeIndices.length < blocksNeeded) {
      next.log.push(`Error: Disk Full. Needed ${blocksNeeded} blocks, but only ${freeIndices.length} free blocks available.`);
      return next;
    }

    const allocatedBlocks = freeIndices.slice(0, blocksNeeded);
    for (let i = 0; i < allocatedBlocks.length; i++) {
      const bIdx = allocatedBlocks[i];
      const nextPtr = i < allocatedBlocks.length - 1 ? allocatedBlocks[i + 1] : null;
      next.blocks[bIdx].isAllocated = true;
      next.blocks[bIdx].fileId = fileId;
      next.blocks[bIdx].fileName = fileName;
      next.blocks[bIdx].nextBlockPointer = nextPtr;
      next.blocks[bIdx].color = color;
    }

    const newFile: VirtualFile = {
      id: fileId,
      name: fileName,
      parentDirId,
      sizeBytes,
      blocksNeeded,
      allocationMethod: 'LINKED',
      allocatedBlocks,
      startBlock: allocatedBlocks[0],
      lengthBlocks: blocksNeeded,
      content,
      createdAt: new Date().toLocaleTimeString(),
      modifiedAt: new Date().toLocaleTimeString(),
      color
    };

    next.files.push(newFile);
    next.log.push(`Linked File "${fileName}" created: Chain of ${blocksNeeded} blocks -> ${allocatedBlocks.join(' -> ')} -> EOF.`);
    return next;

  } else {
    // INDEXED ALLOCATION
    // Needs 1 index block + blocksNeeded data blocks
    const totalNeeded = blocksNeeded + 1;
    const freeIndices = next.blocks.map((b, i) => (!b.isAllocated ? i : -1)).filter(i => i !== -1);
    if (freeIndices.length < totalNeeded) {
      next.log.push(`Error: Insufficient space for Indexed File (${totalNeeded} blocks needed including index block).`);
      return next;
    }

    const indexBlockNum = freeIndices[0];
    const dataBlocks = freeIndices.slice(1, totalNeeded);

    // Set up index block
    next.blocks[indexBlockNum].isAllocated = true;
    next.blocks[indexBlockNum].fileId = fileId;
    next.blocks[indexBlockNum].fileName = `${fileName} [Index]`;
    next.blocks[indexBlockNum].isIndexBlock = true;
    next.blocks[indexBlockNum].indexedBlocks = [...dataBlocks];
    next.blocks[indexBlockNum].color = '#EAB308'; // Amber for index block

    // Set up data blocks
    for (const bIdx of dataBlocks) {
      next.blocks[bIdx].isAllocated = true;
      next.blocks[bIdx].fileId = fileId;
      next.blocks[bIdx].fileName = fileName;
      next.blocks[bIdx].color = color;
    }

    const newFile: VirtualFile = {
      id: fileId,
      name: fileName,
      parentDirId,
      sizeBytes,
      blocksNeeded,
      allocationMethod: 'INDEXED',
      allocatedBlocks: dataBlocks,
      indexBlock: indexBlockNum,
      content,
      createdAt: new Date().toLocaleTimeString(),
      modifiedAt: new Date().toLocaleTimeString(),
      color
    };

    next.files.push(newFile);
    next.log.push(`Indexed File "${fileName}" created: Index Block #${indexBlockNum} pointing to data blocks [${dataBlocks.join(', ')}].`);
    return next;
  }
}

export function deleteFile(state: FileSystemState, fileId: string): FileSystemState {
  const next = JSON.parse(JSON.stringify(state)) as FileSystemState;
  const fileIndex = next.files.findIndex(f => f.id === fileId);
  if (fileIndex === -1) return next;

  const file = next.files[fileIndex];

  // Free all allocated blocks
  for (let i = 0; i < next.blocks.length; i++) {
    if (next.blocks[i].fileId === fileId) {
      next.blocks[i].isAllocated = false;
      next.blocks[i].fileId = undefined;
      next.blocks[i].fileName = undefined;
      next.blocks[i].isIndexBlock = undefined;
      next.blocks[i].nextBlockPointer = undefined;
      next.blocks[i].indexedBlocks = undefined;
      next.blocks[i].color = undefined;
    }
  }

  next.files.splice(fileIndex, 1);
  next.log.push(`Deleted file "${file.name}". Deallocated ${file.allocatedBlocks.length + (file.indexBlock !== undefined ? 1 : 0)} blocks.`);
  return next;
}

export function renameFile(state: FileSystemState, fileId: string, newName: string): FileSystemState {
  const next = JSON.parse(JSON.stringify(state)) as FileSystemState;
  const file = next.files.find(f => f.id === fileId);
  if (!file) return next;

  const old = file.name;
  file.name = newName;
  file.modifiedAt = new Date().toLocaleTimeString();

  next.blocks.forEach(b => {
    if (b.fileId === fileId) {
      b.fileName = b.isIndexBlock ? `${newName} [Index]` : newName;
    }
  });

  next.log.push(`Renamed file "${old}" to "${newName}".`);
  return next;
}
