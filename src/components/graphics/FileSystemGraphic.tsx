import React from 'react';
import { FileAllocationMethod, VirtualFile, FileSystemBlock } from '../../engine/filesystem/types';
import { FolderTree, HardDrive, ArrowRight, Layers, FileText } from 'lucide-react';

interface FileSystemGraphicProps {
  method: FileAllocationMethod;
  selectedFile: VirtualFile | null | undefined;
  blocks: FileSystemBlock[];
  totalBlocks: number;
}

export const FileSystemGraphic: React.FC<FileSystemGraphicProps> = ({
  method,
  selectedFile,
  blocks,
  totalBlocks,
}) => {
  return (
    <div className="glass-panel-elevated rounded-2xl p-5 border border-[var(--glass-border)] space-y-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Interactive Disk Block Allocation Topology</h2>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Graphical pointer architecture comparing Contiguous, Linked List, and Inode Indexing
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
          Mode: {method} Allocation
        </span>
      </div>

      {/* Graphical Topology Canvas */}
      <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] space-y-3">
        {selectedFile ? (
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: selectedFile.color }} />
                <span className="font-bold text-[var(--text-primary)] text-sm">{selectedFile.name}</span>
                <span className="text-[10px] text-[var(--text-muted)]">({selectedFile.sizeBytes} bytes, {selectedFile.blocksNeeded} blocks)</span>
              </div>
              <span className="text-cyan-400 font-bold uppercase">{selectedFile.allocationMethod}</span>
            </div>

            {/* Visual Block Linkage / Chain */}
            {selectedFile.allocationMethod === 'CONTIGUOUS' && (
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] space-y-2">
                <span className="text-[11px] text-[var(--text-secondary)] font-bold">Contiguous Sector Block Span:</span>
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500 text-indigo-400 font-bold text-center min-w-[70px]">
                    Start #{selectedFile.startBlock}
                  </div>
                  <div className="h-0.5 flex-1 bg-indigo-500 min-w-[40px] relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] text-cyan-400 whitespace-nowrap">
                      {selectedFile.lengthBlocks} consecutive blocks
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500 text-indigo-400 font-bold text-center min-w-[70px]">
                    End #{(selectedFile.startBlock || 0) + (selectedFile.lengthBlocks || 1) - 1}
                  </div>
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  Zero seek latency during sequential access; susceptible to external fragmentation.
                </div>
              </div>
            )}

            {selectedFile.allocationMethod === 'LINKED' && (
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] space-y-2">
                <span className="text-[11px] text-[var(--text-secondary)] font-bold">Linked Sector Pointer Chain:</span>
                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
                  {selectedFile.allocatedBlocks.map((blkNum, idx) => (
                    <React.Fragment key={blkNum}>
                      <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500 text-center shrink-0 min-w-[60px]">
                        <div className="text-[9px] text-[var(--text-muted)]">Block</div>
                        <div className="text-xs font-bold text-[var(--text-primary)]">#{blkNum}</div>
                      </div>
                      {idx < selectedFile.allocatedBlocks.length - 1 ? (
                        <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500 text-rose-300 font-bold text-xs shrink-0">
                          EOF
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  No external disk fragmentation; sequential reads follow pointer chains.
                </div>
              </div>
            )}

            {selectedFile.allocationMethod === 'INDEXED' && (
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] space-y-2">
                <span className="text-[11px] text-[var(--text-secondary)] font-bold">Inode Index Block & Direct Pointer Table:</span>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-center">
                    <div className="text-[10px] text-amber-400 uppercase font-bold">Index Inode Block</div>
                    <div className="text-base font-extrabold text-[var(--text-primary)]">#{selectedFile.indexBlock}</div>
                    <div className="text-[9px] text-[var(--text-muted)] mt-1">Pointer Table Directory</div>
                  </div>

                  <div className="md:col-span-8 p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)]">
                    <div className="text-[10px] text-[var(--text-secondary)] mb-1.5 font-bold">Direct Block Pointers:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedFile.allocatedBlocks.map((blkNum) => (
                        <span key={blkNum} className="px-2 py-1 rounded-md bg-indigo-500/20 border border-indigo-500/40 text-cyan-400 font-bold text-xs">
                          Pointer → Block #{blkNum}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  Fast direct random access without traversing pointer chains; inode overhead per file.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-[var(--text-muted)] font-mono">
            Click any file in the directory tree below to visualize its disk block layout.
          </div>
        )}
      </div>
    </div>
  );
};
