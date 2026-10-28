import { SegmentDescriptor, SegmentationTranslationResult } from './types';

export const DEFAULT_SEGMENTS: SegmentDescriptor[] = [
  { segmentNumber: 0, name: 'Code / Text', baseAddress: 1400, limit: 1000, permissions: 'r-x', color: '#638BFF' },
  { segmentNumber: 1, name: 'Data / Globals', baseAddress: 6300, limit: 400, permissions: 'rw-', color: '#47E6D0' },
  { segmentNumber: 2, name: 'Heap (Dynamic)', baseAddress: 4300, limit: 400, permissions: 'rw-', color: '#A78BFA' },
  { segmentNumber: 3, name: 'Stack (Call frames)', baseAddress: 3200, limit: 1100, permissions: 'rw-', color: '#F08CFF' },
  { segmentNumber: 4, name: 'Shared Libraries', baseAddress: 4700, limit: 1000, permissions: 'r-x', color: '#FFC66D' }
];

export function translateSegmentAddress(
  segmentNumber: number,
  offset: number,
  segmentTable: SegmentDescriptor[]
): SegmentationTranslationResult {
  const steps: SegmentationTranslationResult['steps'] = [];

  // Step 1: Look up segment number in Segment Table
  const segment = segmentTable.find(s => s.segmentNumber === segmentNumber);

  if (!segment) {
    steps.push({
      title: 'Segment Lookup',
      description: `Segment index s=${segmentNumber} does not exist in the active Segment Table (STBR / STLR check failed).`,
      status: 'fail'
    });
    return {
      segmentNumber,
      offset,
      isValid: false,
      baseAddress: null,
      limit: null,
      physicalAddress: null,
      error: `Invalid segment number ${segmentNumber}. Not defined in segment table.`,
      isSegmentationFault: true,
      steps
    };
  }

  steps.push({
    title: 'Segment Table Lookup',
    description: `Found Segment ${segmentNumber} ("${segment.name}"): Base = ${segment.baseAddress}, Limit = ${segment.limit}.`,
    status: 'pass'
  });

  // Step 2: Bound checking (d < limit)
  if (offset < 0) {
    steps.push({
      title: 'Bound Check',
      description: `Negative offset ${offset} is strictly invalid.`,
      status: 'fail'
    });
    return {
      segmentNumber,
      offset,
      isValid: false,
      baseAddress: segment.baseAddress,
      limit: segment.limit,
      physicalAddress: null,
      error: `Segmentation Fault: Negative offset ${offset} violation.`,
      isSegmentationFault: true,
      steps
    };
  }

  if (offset >= segment.limit) {
    steps.push({
      title: 'Limit Bound Check: d < Limit',
      description: `Offset d=${offset} >= Limit ${segment.limit}. Bound check failed! Trap to Operating System.`,
      status: 'fail'
    });
    return {
      segmentNumber,
      offset,
      isValid: false,
      baseAddress: segment.baseAddress,
      limit: segment.limit,
      physicalAddress: null,
      error: `Segmentation Fault: Offset ${offset} exceeds Segment ${segmentNumber} limit (${segment.limit}). Access violation trapped to kernel.`,
      isSegmentationFault: true,
      steps
    };
  }

  steps.push({
    title: 'Limit Bound Check: d < Limit',
    description: `Offset d=${offset} is within valid bounds (0 <= ${offset} < ${segment.limit}).`,
    status: 'pass'
  });

  // Step 3: Physical address calculation: Base + Offset
  const physicalAddress = segment.baseAddress + offset;
  steps.push({
    title: 'Address Arithmetic: Base + Offset',
    description: `Physical Address = Base (${segment.baseAddress}) + Offset (${offset}) = ${physicalAddress}.`,
    status: 'pass'
  });

  return {
    segmentNumber,
    offset,
    isValid: true,
    baseAddress: segment.baseAddress,
    limit: segment.limit,
    physicalAddress,
    isSegmentationFault: false,
    steps
  };
}
