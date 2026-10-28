import React from 'react';
import { SegmentationTranslationResult } from '../../engine/segmentation/types';
import { Binary, Cpu, Calculator, ShieldCheck, ShieldAlert, ArrowRight, Database } from 'lucide-react';

interface MmuSegmentationGraphicProps {
  segmentNumber: number;
  offset: number;
  translation: SegmentationTranslationResult;
}

export const MmuSegmentationGraphic: React.FC<MmuSegmentationGraphicProps> = ({
  segmentNumber,
  offset,
  translation,
}) => {
  return (
    <div className="glass-panel-elevated rounded-2xl p-5 border border-[var(--glass-border)] space-y-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Binary className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Interactive Hardware Segmentation MMU Unit</h2>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Base & Limit register comparator, arithmetic adder, and hardware trap detection
            </p>
          </div>
        </div>
        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
          translation.isValid
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            : 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
        }`}>
          {translation.isValid ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
          {translation.isValid ? 'VALID ADDRESS (MMU PASSED)' : 'TRAP: SEGMENTATION FAULT (SIGSEGV)'}
        </span>
      </div>

      {/* Hardware Schematic Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Step 1: CPU Logical Address */}
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-center space-y-2 shadow-sm">
          <div className="flex items-center justify-center gap-1 text-[10px] font-mono uppercase font-bold text-indigo-400">
            <Cpu className="w-3.5 h-3.5" />
            <span>1. CPU Logical Pair</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--glass-border)] space-y-1">
            <div className="text-[10px] text-[var(--text-muted)] font-mono">Segment + Offset</div>
            <div className="text-base font-extrabold font-mono text-[var(--text-primary)]">
              (s: {segmentNumber}, d: {offset})
            </div>
          </div>
          <div className="text-[10px] font-mono text-[var(--text-secondary)]">
            User Ring 3 Address
          </div>
        </div>

        {/* Step 2: Segment Table Limit & Base lookup */}
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-center space-y-2 shadow-sm">
          <div className="flex items-center justify-center gap-1 text-[10px] font-mono uppercase font-bold text-purple-400">
            <Binary className="w-3.5 h-3.5" />
            <span>2. Table Register (STBR)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--glass-border)] space-y-1 text-xs font-mono">
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--text-muted)]">Base:</span>
              <span className="text-cyan-400 font-bold">{translation.baseAddress ?? 'N/A'}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--text-muted)]">Limit:</span>
              <span className="text-purple-400 font-bold">{translation.limit ?? 'N/A'}</span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-[var(--text-muted)]">
            Descriptor Fetched
          </div>
        </div>

        {/* Step 3: Hardware Comparator Unit */}
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-center space-y-2 shadow-sm">
          <div className="flex items-center justify-center gap-1 text-[10px] font-mono uppercase font-bold text-amber-400">
            <Calculator className="w-3.5 h-3.5" />
            <span>3. Hardware Comparator</span>
          </div>
          <div className={`p-2.5 rounded-lg border space-y-1 font-mono text-xs ${
            translation.isValid
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
              : 'bg-rose-500/15 border-rose-500/50 text-rose-300'
          }`}>
            <div className="text-[10px]">Test: offset &lt; limit?</div>
            <div className="text-sm font-bold">
              {translation.limit !== undefined ? `${offset} < ${translation.limit} (${translation.isValid ? 'YES' : 'NO'})` : 'Invalid'}
            </div>
          </div>
          <div className="text-[10px] font-mono font-semibold">
            {translation.isValid ? <span className="text-emerald-400">Bounds Verified</span> : <span className="text-rose-400">Hardware Trap</span>}
          </div>
        </div>

        {/* Step 4: Physical Address Adder */}
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-center space-y-2 shadow-sm">
          <div className="flex items-center justify-center gap-1 text-[10px] font-mono uppercase font-bold text-emerald-400">
            <Database className="w-3.5 h-3.5" />
            <span>4. Physical RAM Bus</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--glass-border)]">
            <div className="text-[10px] text-[var(--text-muted)] font-mono">Formula: Base + Offset</div>
            <div className="text-base font-extrabold font-mono text-cyan-400">
              {translation.isValid && translation.physicalAddress !== null ? translation.physicalAddress : 'TRAP (SIGSEGV)'}
            </div>
          </div>
          <div className="text-[10px] font-mono text-emerald-400 font-semibold">
            {translation.isValid ? 'Physical RAM Strobe' : 'Kernel Trap'}
          </div>
        </div>
      </div>
    </div>
  );
};
