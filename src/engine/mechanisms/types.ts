export type MechanismDomain = 'BOOT_SEQUENCE' | 'SYSTEM_CALL_DUAL_MODE' | 'PROCESS_VS_THREAD';

export interface BootStep {
  id: string;
  stageName: string;
  hardwareLevel: string;
  cpuMode: string;
  description: string;
  status: 'pending' | 'running' | 'completed';
  components: string[];
}

export interface SyscallStep {
  stepNumber: number;
  cpuRing: 'Ring 3 (User Mode)' | 'Ring 0 (Kernel Mode)';
  location: string;
  action: string;
  registers: {
    rax: string;
    rdi: string;
    rsi: string;
    rdx: string;
    rsp: string;
    rip: string;
  };
  explanation: string;
}

export interface MemorySegmentComparison {
  segmentName: string;
  description: string;
  sharedAcrossThreads: boolean;
  isolatedPerProcess: boolean;
  exampleData: string;
}
