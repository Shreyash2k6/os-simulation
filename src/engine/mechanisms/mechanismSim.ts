import { BootStep, SyscallStep, MemorySegmentComparison } from './types';

export const BOOT_STAGES: BootStep[] = [
  {
    id: 'post',
    stageName: '1. Power-On & POST',
    hardwareLevel: 'Motherboard Firmware / CPU',
    cpuMode: 'Real Mode (16-bit 0xFFFF0 Reset Vector)',
    description: 'Hardware resets CPU registers. Processor jumps to BIOS/UEFI ROM reset vector. Executes Power-On Self Test (POST) checking RAM, CPU cache, and bus interfaces.',
    status: 'completed',
    components: ['CPU Reset Vector', 'CMOS / NVRAM', 'DRAM Controller', 'PCIe Bus']
  },
  {
    id: 'bootloader-stage1',
    stageName: '2. Firmware & Primary Bootloader',
    hardwareLevel: 'Storage Controller / NVMe / MBR',
    cpuMode: 'Real Mode -> Unpack to Protected Mode',
    description: 'Firmware interrogates boot priority order. Loads 512-byte Master Boot Record (MBR) or UEFI ESP partition into memory at address 0x7C00 and transfers control.',
    status: 'pending',
    components: ['ESP / EFI System Partition', 'MBR Sector 0', 'Boot Partition Table']
  },
  {
    id: 'bootloader-stage2',
    stageName: '3. Secondary Bootloader (GRUB / systemd-boot)',
    hardwareLevel: 'Disk File System Driver',
    cpuMode: '32-bit Protected Mode (A20 Gate Enabled)',
    description: 'GRUB initializes basic disk filesystem drivers (ext4, fat32), presents OS menu, reads kernel image (vmlinuz) and initial ramdisk (initrd/initramfs) into memory.',
    status: 'pending',
    components: ['GRUB Stage 2', 'vmlinuz (bzImage)', 'initramfs (cpio archive)']
  },
  {
    id: 'kernel-init',
    stageName: '4. Kernel Initialization & Long Mode Switch',
    hardwareLevel: 'CPU MMU, APIC, Page Tables',
    cpuMode: '64-bit Long Mode (Ring 0 Kernel Space)',
    description: 'Kernel decompresses, activates Long Mode with 4-level paging (PML4), programs Interrupt Descriptor Table (IDT), detects CPUs via ACPI, and starts the virtual memory manager.',
    status: 'pending',
    components: ['IDT (Interrupt Table)', 'CR3 Page Directory Base', 'APIC Multiprocessing', 'Slab Allocator']
  },
  {
    id: 'init-process',
    stageName: '5. PID 1 (Init / Systemd) & User Space',
    hardwareLevel: 'Virtual Memory (Ring 3 User Space)',
    cpuMode: 'Ring 3 User Mode',
    description: 'Kernel mounts root filesystem, launches first user-space process (PID 1 /sbin/init or systemd). Spawns device daemons, network stack, login managers, and interactive graphical shell.',
    status: 'pending',
    components: ['PID 1 systemd', 'udev / D-Bus', 'Display Server / Wayland', 'User Shell']
  }
];

export const SYSCALL_TRACE: SyscallStep[] = [
  {
    stepNumber: 1,
    cpuRing: 'Ring 3 (User Mode)',
    location: 'User Application Space (e.g. write() wrapper in libc)',
    action: 'Prepare Syscall Arguments in CPU Registers',
    registers: {
      rax: '1 (SYS_write syscall number)',
      rdi: '1 (File Descriptor: STDOUT)',
      rsi: '0x007ffe814a (Pointer to buffer "Hello\\n")',
      rdx: '6 (Count: 6 bytes)',
      rsp: '0x007ffe8140 (User Stack Pointer)',
      rip: '0x00401140 (User Code Address)'
    },
    explanation: 'User code cannot write directly to display hardware. It loads parameters into standard x86_64 ABI registers and prepares to trigger a software trap.'
  },
  {
    stepNumber: 2,
    cpuRing: 'Ring 3 (User Mode)',
    location: 'CPU Transition Boundary',
    action: 'Execute "syscall" (or "int 0x80") Assembly Instruction',
    registers: {
      rax: '1',
      rdi: '1',
      rsi: '0x007ffe814a',
      rdx: '6',
      rsp: 'Swapping to Kernel RSP0...',
      rip: 'Saving User RIP into RCX register...'
    },
    explanation: 'Hardware trap instruction triggers immediate CPU privilege transition. CPU saves user RIP to RCX, user RFLAGS to R11, and forces CPU privilege level to Ring 0 (Kernel Mode).'
  },
  {
    stepNumber: 3,
    cpuRing: 'Ring 0 (Kernel Mode)',
    location: 'Kernel Entry Point (MSR_LSTAR / entry_SYSCALL_64)',
    action: 'Context Save & Dispatch via Syscall Table',
    registers: {
      rax: '1 (Index to sys_call_table[1])',
      rdi: '1',
      rsi: '0x007ffe814a',
      rdx: '6',
      rsp: '0xffff88800018 (Kernel Stack Pointer)',
      rip: '0xffffffff81a0 (Kernel Syscall Dispatcher)'
    },
    explanation: 'Kernel saves user registers onto the thread\'s kernel stack. Validates user buffer pointer (0x007ffe814a) using access_ok() to prevent malicious kernel memory exploits.'
  },
  {
    stepNumber: 4,
    cpuRing: 'Ring 0 (Kernel Mode)',
    location: 'Kernel Subsystem / Virtual File System (VFS)',
    action: 'Execute Kernel Service (vfs_write -> tty_write)',
    registers: {
      rax: '6 (Bytes successfully written)',
      rdi: '1',
      rsi: '0x007ffe814a',
      rdx: '6',
      rsp: '0xffff88800018',
      rip: '0xffffffff8142 (sys_write routine)'
    },
    explanation: 'Kernel handles the write to terminal / console buffer. Places the return value (6 bytes written) into RAX.'
  },
  {
    stepNumber: 5,
    cpuRing: 'Ring 3 (User Mode)',
    location: 'Return to User Application',
    action: 'Execute "sysretq" (Restore Ring 3 State)',
    registers: {
      rax: '6 (Return Value: 6)',
      rdi: '1',
      rsi: '0x007ffe814a',
      rdx: '6',
      rsp: '0x007ffe8140 (Restored User Stack)',
      rip: '0x00401142 (Next User Instruction)'
    },
    explanation: 'Kernel executes sysretq, dropping CPU privilege back to Ring 3 and restoring user stack pointer and instruction pointer. User program continues execution seamlessly.'
  }
];

export const PROCESS_VS_THREAD_SEGMENTS: MemorySegmentComparison[] = [
  {
    segmentName: 'Code / Text Segment',
    description: 'Compiled executable machine instructions (read-only, executable).',
    sharedAcrossThreads: true,
    isolatedPerProcess: true,
    exampleData: '0x400000: mov rax, 1; syscall;'
  },
  {
    segmentName: 'Data & BSS Segment',
    description: 'Global and static variables initialized or uninitialized at load time.',
    sharedAcrossThreads: true,
    isolatedPerProcess: true,
    exampleData: 'int g_system_counter = 42;'
  },
  {
    segmentName: 'Heap Segment',
    description: 'Dynamically allocated memory requested via malloc() or new.',
    sharedAcrossThreads: true,
    isolatedPerProcess: true,
    exampleData: 'char* buffer = malloc(4096);'
  },
  {
    segmentName: 'File Descriptors & Sockets',
    description: 'Open file table pointers, network sockets, IPC pipes, signal handlers.',
    sharedAcrossThreads: true,
    isolatedPerProcess: true,
    exampleData: 'fd[0]=stdin, fd[1]=stdout, fd[3]=socket'
  },
  {
    segmentName: 'Thread Stack (Private)',
    description: 'Local function call frames, parameters, return addresses, local variables.',
    sharedAcrossThreads: false,
    isolatedPerProcess: true,
    exampleData: 'Thread 1 RSP: 0x7fff00; Thread 2 RSP: 0x7ffe00'
  },
  {
    segmentName: 'CPU Registers & Program Counter',
    description: 'Architectural state (RAX, RBX, RCX, RDX, RIP instruction pointer).',
    sharedAcrossThreads: false,
    isolatedPerProcess: true,
    exampleData: 'Thread 1 at RIP=0x401020; Thread 2 at RIP=0x401890'
  }
];
