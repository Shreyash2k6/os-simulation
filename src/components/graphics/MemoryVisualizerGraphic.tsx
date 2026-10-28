import React from 'react';
import { MemoryBlock, DynamicAllocationAlgorithm } from '../../engine/memory/types';
import { Layers, Database, ArrowDown, CheckCircle2, Split, Sparkles } from 'lucide-react';

interface MemoryVisualizerGraphicProps {
  algorithm: DynamicAllocationAlgorithm | 'BUDDY_SYSTEM';
  totalMemory: number;
  blocks: MemoryBlock[];
  activeBlockId?: string;
  isBuddyMode?: boolean;
}

export const MemoryVisualizerGraphic: React.FC<MemoryVisualizerGraphicProps> = ({
  algorithm,
  totalMemory,
  blocks,
  activeBlockId,
  isBuddyMode,
}) => {
  return (
    <div className="glass-panel-elevated rounded-2xl p-5 border border-[var(--glass-border)] space-y-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Interactive Physical Memory Silicon Bar</h2>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Hardware address space ladder with dynamic hole-scanning and Buddy binary splitting
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
          Strategy: {algorithm.replace('_', ' ')}
        </span>
      </div>

      {/* Visual Silicon RAM Stick */}
      <div className="space-y-3 p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] shadow-inner">
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] px-1">
          <span>Base: 0 KB (0x0000)</span>
          <span>Physical Address Ladder (1024 KB Total RAM)</span>
          <span>Limit: {totalMemory} KB (0x0400)</span>
        </div>

        {/* Linear Memory Bar with proportional segments */}
        <div className="w-full h-12 bg-[var(--bg-secondary)] rounded-xl border border-[var(--glass-border)] flex overflow-hidden p-1 gap-1 shadow-inner relative">
          {blocks.map((block) => {
            const widthPct = Math.max(3, (block.size / totalMemory) * 100);
            const isAllocated = block.isAllocated;
            const isActive = block.id === activeBlockId;

            return (
              <div
                key={block.id}
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: isAllocated ? (block.color || '#4F80FF') : undefined
                }}
                className={`h-full rounded-lg transition-all duration-300 relative group flex flex-col items-center justify-center text-center ${
                  isActive
                    ? 'ring-2 ring-white scale-[1.02] z-10 shadow-lg'
                    : isAllocated
                    ? 'shadow-sm text-white'
                    : 'bg-[var(--bg-elevated)] border border-dashed border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-[var(--glass-bg)]'
                }`}
                title={isAllocated ? `Block ${block.processId || 'Allocated'}: ${block.size} KB` : `Free Hole: ${block.size} KB`}
              >
                <span className="text-[10px] font-mono font-bold truncate px-1">
                  {isAllocated ? (block.processId || 'ALLOC') : `${block.size}K`}
                </span>
                <span className="text-[8px] font-mono opacity-70 truncate">
                  {block.startAddress}K
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--glass-border)] text-[11px] font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <span className="w-3 h-3 rounded bg-indigo-500 shadow-sm" /> Allocated Process Chunk
            </span>
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <span className="w-3 h-3 rounded bg-[var(--bg-secondary)] border border-dashed border-[var(--glass-border)]" /> Free Available Hole
            </span>
          </div>
          <div className="text-[var(--text-muted)]">
            Total Blocks: {blocks.length} ({blocks.filter((b) => b.isAllocated).length} allocated, {blocks.filter((b) => !b.isAllocated).length} free)
          </div>
        </div>
      </div>

      {/* Buddy System Power-of-2 Hierarchical Splitting Graphic (When Buddy is selected) */}
      {(algorithm === 'BUDDY_SYSTEM' || isBuddyMode) && (
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 font-mono uppercase flex items-center gap-1.5">
              <Split className="w-3.5 h-3.5" />
              Buddy System Power-of-2 Binary Splitting Tree
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">Recursive division into 2^k buddies</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {/* Level 0: 1024K Root */}
            <div className="p-2 rounded-lg bg-[var(--bg-secondary)] border border-indigo-500/40 text-center font-bold text-[var(--text-primary)]">
              Root Pool: 1024 KB
            </div>
            {/* Level 1: 512K Buddies */}
            <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
              <div className="p-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-cyan-400 font-semibold">
                Buddy A: 512 KB
              </div>
              <div className="p-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-cyan-400 font-semibold">
                Buddy B: 512 KB
              </div>
            </div>
            {/* Level 2: 256K Buddies */}
            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
              <div className="p-1 rounded bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-purple-400">256K</div>
              <div className="p-1 rounded bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-purple-400">256K</div>
              <div className="p-1 rounded bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-purple-400">256K</div>
              <div className="p-1 rounded bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-purple-400">256K</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
