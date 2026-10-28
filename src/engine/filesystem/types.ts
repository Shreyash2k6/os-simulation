export type FileAllocationMethod = 'CONTIGUOUS' | 'LINKED' | 'INDEXED';

export interface DiskBlock {
  blockNumber: number;
  isAllocated: boolean;
  fileId?: string;
  fileName?: string;
  isIndexBlock?: boolean;
  nextBlockPointer?: number | null; // For linked allocation
  indexedBlocks?: number[];         // For indexed allocation (if this is the index block)
  color?: string;
}

export interface VirtualFile {
  id: string;
  name: string;
  parentDirId: string;
  sizeBytes: number;
  blocksNeeded: number;
  allocationMethod: FileAllocationMethod;
  allocatedBlocks: number[];
  indexBlock?: number; // For indexed allocation
  startBlock?: number; // For contiguous allocation
  lengthBlocks?: number;
  content: string;
  createdAt: string;
  modifiedAt: string;
  color: string;
}

export interface VirtualDirectory {
  id: string;
  name: string;
  parentDirId: string | null;
  createdAt: string;
}

export interface FileSystemState {
  totalBlocks: number;
  blockSizeBytes: number;
  allocationMethod: FileAllocationMethod;
  blocks: DiskBlock[];
  files: VirtualFile[];
  directories: VirtualDirectory[];
  currentDirId: string;
  log: string[];
}
