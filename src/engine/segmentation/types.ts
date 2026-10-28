export interface SegmentDescriptor {
  segmentNumber: number;
  name: string;
  baseAddress: number;
  limit: number; // Length of segment in bytes/words
  permissions?: string; // 'r-x', 'rw-', 'r--'
  color?: string;
}

export interface SegmentationTranslationResult {
  segmentNumber: number;
  offset: number;
  isValid: boolean;
  baseAddress: number | null;
  limit: number | null;
  physicalAddress: number | null;
  error?: string;
  isSegmentationFault: boolean;
  steps: {
    title: string;
    description: string;
    status: 'pass' | 'fail' | 'info';
  }[];
}
