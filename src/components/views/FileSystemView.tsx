import React, { useState } from 'react';
import { 
  FileAllocationMethod, 
  FileSystemState, 
  VirtualFile 
} from '../../engine/filesystem/types';
import { 
  createInitialFileSystem, 
  createFile, 
  deleteFile, 
  renameFile 
} from '../../engine/filesystem/simFS';
import { MetricCard } from '../common/MetricCard';
import { LogViewer } from '../common/LogViewer';
import { FileSystemGraphic } from '../graphics/FileSystemGraphic';
import { 
  FolderTree, 
  FilePlus, 
  Trash2, 
  Edit3, 
  HardDrive, 
  FileText, 
  RotateCcw, 
  Check, 
  X, 
  Folder, 
  Layers 
} from 'lucide-react';

export const FileSystemView: React.FC = () => {
  const [fsState, setFsState] = useState<FileSystemState>(() => createInitialFileSystem(64, 512, 'INDEXED'));
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // New File Modal / Form State
  const [newFileName, setNewFileName] = useState<string>('notes.txt');
  const [newFileSize, setNewFileSize] = useState<number>(850);
  const [newFileContent, setNewFileContent] = useState<string>('Operating systems laboratory course notes and simulated disk data.');
  const [allocationStrategy, setAllocationStrategy] = useState<FileAllocationMethod>('INDEXED');

  // Rename State
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const selectedFile = fsState.files.find((f) => f.id === selectedFileId);

  const allocatedBlocksCount = fsState.blocks.filter((b) => b.isAllocated).length;
  const freeBlocksCount = fsState.totalBlocks - allocatedBlocksCount;
  const utilization = ((allocatedBlocksCount / fsState.totalBlocks) * 100).toFixed(1);

  const handleCreate = () => {
    if (!newFileName.trim()) return;
    const next = createFile(
      fsState,
      newFileName.trim(),
      'root',
      newFileSize,
      newFileContent,
      allocationStrategy
    );
    setFsState(next);
    // select new file
    if (next.files.length > 0) {
      setSelectedFileId(next.files[next.files.length - 1].id);
    }
  };

  const handleDelete = (id: string) => {
    const next = deleteFile(fsState, id);
    setFsState(next);
    if (selectedFileId === id) setSelectedFileId(null);
  };

  const handleRenameConfirm = (id: string) => {
    if (!editingName.trim()) return;
    const next = renameFile(fsState, id, editingName.trim());
    setFsState(next);
    setEditingFileId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header and Method Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-5 border border-[var(--glass-border)] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold tracking-wider uppercase mb-1">
            <span className="p-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <FolderTree className="w-3.5 h-3.5" />
            </span>
            <span>Virtual Storage & Block Allocator</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Virtual File System Laboratory</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Explore physical disk block layouts with Contiguous, Linked-List, and Inode-based Indexed block allocation schemes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[var(--bg-elevated)] p-1.5 rounded-xl border border-[var(--glass-border)] text-xs font-mono">
            {(['INDEXED', 'LINKED', 'CONTIGUOUS'] as FileAllocationMethod[]).map((method) => (
              <button
                key={method}
                onClick={() => setAllocationStrategy(method)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  allocationStrategy === method
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400/40'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          <button
            onClick={() => setFsState(createInitialFileSystem(64, 512, allocationStrategy))}
            className="p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition shadow-sm"
            title="Format / Reset simulated disk"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Capacity Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Total Storage"
          value={fsState.totalBlocks}
          unit="blocks"
          subtext={`${(fsState.totalBlocks * fsState.blockSizeBytes) / 1024} KB physical disk`}
          color="blue"
        />
        <MetricCard
          label="Used Blocks"
          value={allocatedBlocksCount}
          unit="blocks"
          subtext={`${fsState.files.length} active files stored`}
          color="cyan"
        />
        <MetricCard
          label="Free Blocks"
          value={freeBlocksCount}
          unit="blocks"
          subtext="Available for writing"
          color="emerald"
        />
        <MetricCard
          label="Storage Utilization"
          value={utilization}
          unit="%"
          subtext="Used / Total Blocks"
          color="violet"
        />
      </div>

      {/* Interactive Disk Block Allocation Topology Graphic */}
      <FileSystemGraphic
        method={allocationStrategy}
        selectedFile={selectedFile}
        blocks={fsState.blocks}
        totalBlocks={fsState.totalBlocks}
      />

      {/* Main 2-Column: File Explorer on Left, Disk Blocks Grid on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File Hierarchy & Creation Controls */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-[var(--glass-border)] space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Folder className="w-4 h-4 text-amber-400" />
              <span>Simulated Directory Tree</span>
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--glass-border)]">
              {fsState.files.length} file(s)
            </span>
          </div>

          {/* Files List */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {fsState.files.map((file) => {
              const isSelected = selectedFileId === file.id;

              return (
                <div
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`p-3 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-[var(--text-primary)] font-bold ring-1 ring-emerald-400/40'
                      : 'bg-[var(--bg-elevated)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: file.color }} />
                    {editingFileId === file.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded px-2 py-0.5 text-xs text-[var(--text-primary)] outline-none"
                        />
                        <button onClick={() => handleRenameConfirm(file.id)} className="text-emerald-400 p-1">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingFileId(null)} className="text-rose-400 p-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="truncate">{file.name}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {file.sizeBytes} B ({file.blocksNeeded}b)
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFileId(file.id);
                        setEditingName(file.name);
                      }}
                      className="p-1 hover:text-[var(--text-primary)] text-[var(--text-muted)] transition"
                      title="Rename"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file.id);
                      }}
                      className="p-1 hover:text-rose-400 text-[var(--text-muted)] transition"
                      title="Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create New File Form */}
          <div className="pt-3 border-t border-[var(--glass-border)] space-y-3">
            <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <FilePlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Create Virtual File</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <label className="text-[var(--text-secondary)] block mb-1 font-semibold">File Name</label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:border-emerald-400 outline-none transition"
                />
              </div>
              <div>
                <label className="text-[var(--text-secondary)] block mb-1 font-semibold">Size (Bytes)</label>
                <input
                  type="number"
                  min="64"
                  max="16384"
                  value={newFileSize}
                  onChange={(e) => setNewFileSize(parseInt(e.target.value) || 512)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:border-emerald-400 outline-none transition"
                />
              </div>
            </div>

            <button
              onClick={handleCreate}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-emerald-500/25 transition"
            >
              Allocate Blocks & Write File
            </button>
          </div>
        </div>

        {/* 64 Disk Blocks Grid Visualizer */}
        <div className="lg:col-span-7 glass-panel-elevated rounded-2xl p-5 border border-[var(--glass-border)] space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>Disk Sector Blocks (64 Blocks × 512 Bytes)</span>
            </h2>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                <span className="w-2 h-2 rounded-sm bg-[var(--bg-elevated)] border border-[var(--glass-border)]" /> Free
              </span>
              <span className="flex items-center gap-1 text-indigo-400 font-semibold">
                <span className="w-2 h-2 rounded-sm bg-indigo-500" /> Data
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <span className="w-2 h-2 rounded-sm bg-amber-400" /> Index
              </span>
            </div>
          </div>

          {/* 8x8 Blocks Grid */}
          <div className="grid grid-cols-8 gap-2 p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--glass-border)] shadow-inner">
            {fsState.blocks.map((block) => {
              const isSelectedFileBlock = selectedFile && block.fileId === selectedFile.id;

              return (
                <div
                  key={block.blockNumber}
                  style={{
                    backgroundColor: block.isAllocated ? (block.color || '#4F80FF') : undefined
                  }}
                  className={`aspect-square rounded-lg border text-[10px] font-mono flex flex-col items-center justify-center transition-all relative group shadow-sm ${
                    isSelectedFileBlock
                      ? 'ring-2 ring-white scale-105 z-10 shadow-lg'
                      : block.isAllocated
                      ? 'border-white/30 text-white'
                      : 'bg-[var(--bg-secondary)] border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-[var(--glass-bg)]'
                  }`}
                  title={block.isAllocated ? `Block #${block.blockNumber}: ${block.fileName}` : `Block #${block.blockNumber}: Free`}
                >
                  <span className="font-bold">{block.blockNumber}</span>
                  {block.isIndexBlock && <span className="text-[8px] uppercase font-bold text-black bg-amber-400 px-1 rounded-sm mt-0.5">IDX</span>}
                </div>
              );
            })}
          </div>

          {/* Selected File Block Relationship Detail */}
          {selectedFile ? (
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] space-y-2 text-xs font-mono shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-2">
                <span className="font-bold text-[var(--text-primary)]">{selectedFile.name}</span>
                <span className="text-emerald-400 font-bold uppercase">{selectedFile.allocationMethod} ALLOCATION</span>
              </div>
              <div className="text-[var(--text-secondary)]">
                {selectedFile.allocationMethod === 'CONTIGUOUS' && (
                  <div>Contiguous Range: Start Block #{selectedFile.startBlock}, Span: {selectedFile.lengthBlocks} blocks</div>
                )}
                {selectedFile.allocationMethod === 'LINKED' && (
                  <div>Linked Pointer Chain: {selectedFile.allocatedBlocks.join(' → ')} → EOF</div>
                )}
                {selectedFile.allocationMethod === 'INDEXED' && (
                  <div>Index Inode Block: #{selectedFile.indexBlock} pointing to data blocks: [{selectedFile.allocatedBlocks.join(', ')}]</div>
                )}
              </div>
              <div className="text-[var(--text-muted)] text-[11px] truncate">
                File Content: "{selectedFile.content}"
              </div>
            </div>
          ) : (
            <div className="p-3 text-center text-xs font-mono text-[var(--text-muted)] italic">
              Click any file on the left to inspect its physical sector block mapping.
            </div>
          )}
        </div>
      </div>

      {/* Event Logs */}
      <LogViewer logs={fsState.log} title="Simulated File System Journal" />
    </div>
  );
};
