import React from 'react';
import { PagingAlgorithm } from '../../engine/paging/types';
import { Cpu, Calculator, ArrowRight, CheckCircle2, AlertTriangle, Layers, Database } from 'lucide-react';

interface MmuPagingGraphicProps {
  algorithm: PagingAlgorithm;
  logicalAddress: number;
  pageSize: number;
  pageNumber: number;
  offset: number;
  frameNumber: number | null;
  physicalAddress: number | null;
  frames: (number | null)[];
  activePage: number | null;
  isHit: boolean | null;
}

export const MmuPagingGraphic: React.FC<MmuPagingGraphicProps> = ({
  algorithm,
  logicalAddress,
  pageSize,
  pageNumber,
  offset,
  frameNumber,
  physicalAddress,
  frames,
  activePage,
  isHit,
}) => {
  return (
    <div className="glass-panel-elevated rounded-2xl p-5 border border-[var(--glass-border)] space-y-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Interactive Hardware MMU Architecture</h2>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Live signal translation from CPU logical address to physical RAM frame
            </p>
          </div>
        </div>
        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
          isHit === true
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            : isHit === false
            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--glass-border)]'
        }`}>
          {isHit === true ? 'PAGE HIT (ZERO OVERHEAD)' : isHit === false ? 'PAGE FAULT (TRAP TO KERNEL)' : 'READY'}
        </span>
      </div>

      {/* Hardware Translation Pipeline Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Step 1: CPU Logical Address Generator */}
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-center space-y-2 shadow-sm">
          <div className="flex items-center justify-center gap-1 text-[10px] font-mono uppercase font-bold text-indigo-400">
            <Cpu className="w-3.5 h-3.5" />
            <span>1. CPU Core Output</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--glass-border)]">
            <div className="text-[10px] text-[var(--text-muted)] font-mono">Logical Address</div>
            <div className="text-base font-extrabold font-mono text-[var(--text-primary)]">{logicalAddress}</div>
            <div className="text-[9px] text-[var(--text-muted)] font-mono">0x{logicalAddress.toString(16).toUpperCase()}</div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
            <div className="p-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              p = {pageNumber}
            </div>
            <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              d = {offset}
            </div>
          </div>
        </div>

        {/* Step 2: Page Table Lookup */}
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-center space-y-2 shadow-sm">
          <div className="flex items-center justify-center gap-1 text-[10px] font-mono uppercase font-bold text-purple-400">
            <Layers className="w-3.5 h-3.5" />
            <span>2. Page Table MMU</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--glass-border)] space-y-1 text-xs font-mono">
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--text-muted)]">Lookup:</span>
              <span className="text-purple-400 font-bold">Page #{pageNumber}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--text-muted)]">Frame:</span>
              <span className={frameNumber !== null ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {frameNumber !== null ? `Frame ${frameNumber}` : 'Fault (Bit 0)'}
              </span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-[var(--text-muted)]">
            Page Size: {pageSize} Bytes
          </div>
        </div>

        {/* Step 3: Physical Address Synthesis */}
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-center space-y-2 shadow-sm">
          <div className="flex items-center justify-center gap-1 text-[10px] font-mono uppercase font-bold text-cyan-400">
            <Calculator className="w-3.5 h-3.5" />
            <span>3. Address Synthesis</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--glass-border)]">
            <div className="text-[10px] text-[var(--text-muted)] font-mono">Formula: (f × size) + d</div>
            <div className="text-sm font-bold font-mono text-cyan-400 truncate">
              {frameNumber !== null ? `(${frameNumber} × ${pageSize}) + ${offset}` : 'Page Not in RAM'}
            </div>
          </div>
          <div className="text-[10px] font-mono text-[var(--text-secondary)]">
            Hardware Addr Unit
          </div>
        </div>

        {/* Step 4: Physical RAM Bus */}
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-center space-y-2 shadow-sm">
          <div className="flex items-center justify-center gap-1 text-[10px] font-mono uppercase font-bold text-emerald-400">
            <Database className="w-3.5 h-3.5" />
            <span>4. Physical RAM Bus</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--glass-border)]">
            <div className="text-[10px] text-[var(--text-muted)] font-mono">Final Physical Address</div>
            <div className="text-base font-extrabold font-mono text-emerald-400">
              {physicalAddress !== null ? physicalAddress : 'N/A (Trap)'}
            </div>
            <div className="text-[9px] text-[var(--text-muted)] font-mono">
              {physicalAddress !== null ? `0x${physicalAddress.toString(16).toUpperCase()}` : 'Kernel Fault'}
            </div>
          </div>
          <div className="text-[10px] font-mono text-emerald-400 font-semibold">
            {physicalAddress !== null ? 'Bus Ready' : 'Swap Needed'}
          </div>
        </div>
      </div>
    </div>
  );
};
