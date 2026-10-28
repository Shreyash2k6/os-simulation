import React, { useState, useEffect } from 'react';
import { 
  getSavedSimulations, 
  deleteSavedSimulation, 
  duplicateSavedSimulation, 
  renameSavedSimulation, 
  exportSimulationsToJSON, 
  importSimulationsFromJSON, 
  saveSimulation,
  SavedSimulationItem 
} from '../../engine/../storage/db';
import { 
  Bookmark, 
  Download, 
  Upload, 
  Trash2, 
  Copy, 
  Edit3, 
  Check, 
  X, 
  Play, 
  Sparkles, 
  Clock 
} from 'lucide-react';

interface SavedSimulationsViewProps {
  onLoadSimulation: (sim: SavedSimulationItem) => void;
}

export const SavedSimulationsView: React.FC<SavedSimulationsViewProps> = ({ onLoadSimulation }) => {
  const [savedList, setSavedList] = useState<SavedSimulationItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [importMessage, setImportMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const refreshList = () => {
    setSavedList(getSavedSimulations());
  };

  useEffect(() => {
    refreshList();
  }, []);

  const handleDuplicate = (id: string) => {
    duplicateSavedSimulation(id);
    refreshList();
  };

  const handleDelete = (id: string) => {
    deleteSavedSimulation(id);
    refreshList();
  };

  const handleRenameConfirm = (id: string) => {
    if (!editingName.trim()) return;
    renameSavedSimulation(id, editingName.trim());
    setEditingId(null);
    refreshList();
  };

  const handleExport = () => {
    const jsonStr = exportSimulationsToJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oslab_saved_simulations_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importSimulationsFromJSON(content);
      if (res.success) {
        setImportMessage({ text: `Successfully imported ${res.importedCount} simulations.` });
        refreshList();
      } else {
        setImportMessage({ text: res.error || 'Import failed.', isError: true });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddSamplePreset = () => {
    saveSimulation({
      name: 'Textbook CPU RR Benchmark (Quantum 2)',
      domain: 'cpu',
      algorithm: 'ROUND_ROBIN',
      notes: 'Standard 4-process CPU benchmark with mixed bursts.',
      config: {
        algorithm: 'ROUND_ROBIN',
        timeQuantum: 2,
        processes: [
          { id: 'P1', name: 'Compiler', arrivalTime: 0, burstTime: 8, priority: 2 },
          { id: 'P2', name: 'Web Server', arrivalTime: 1, burstTime: 4, priority: 1 },
          { id: 'P3', name: 'Video Encoder', arrivalTime: 2, burstTime: 9, priority: 3 }
        ]
      }
    });

    saveSimulation({
      name: 'Belady Paging Anomaly Demo (3 Frames)',
      domain: 'paging',
      algorithm: 'FIFO',
      notes: 'Reference sequence demonstrating page faults behavior.',
      config: {
        algorithm: 'FIFO',
        frameCount: 3,
        referenceString: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
      }
    });

    refreshList();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-5 border border-[var(--glass-border)] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-semibold tracking-wider uppercase mb-1">
            <span className="p-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Bookmark className="w-3.5 h-3.5" />
            </span>
            <span>Persistence & Preset Scenarios</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Saved Simulations & Presets</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Persist custom workloads locally, duplicate scenarios, and export/import configuration archives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="px-3 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono flex items-center gap-1.5 cursor-pointer transition shadow-sm">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          <button
            onClick={handleExport}
            className="px-3 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono flex items-center gap-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export Archive</span>
          </button>

          <button
            onClick={handleAddSamplePreset}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition hover:opacity-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Presets</span>
          </button>
        </div>
      </div>

      {importMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-mono border flex items-center justify-between shadow-sm ${
            importMessage.isError
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          }`}
        >
          <span>{importMessage.text}</span>
          <button onClick={() => setImportMessage(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Simulations Grid */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-[var(--glass-border)] space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Stored Workloads ({savedList.length} items)</h2>
          <span className="text-xs text-[var(--text-muted)] font-mono">Stored securely in local storage</span>
        </div>

        {savedList.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="text-[var(--text-muted)] text-xs font-mono">No custom simulations saved yet.</div>
            <button
              onClick={handleAddSamplePreset}
              className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-cyan-400 font-mono transition shadow-sm"
            >
              Load Sample Textbook Presets
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {savedList.map((sim) => (
              <div
                key={sim.id}
                className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] hover:border-indigo-400/50 transition-all flex flex-col justify-between space-y-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-bold">
                      {sim.domain} • {sim.algorithm}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(sim.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>

                  {editingId === sim.id ? (
                    <div className="flex items-center gap-1 mb-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] font-bold w-full outline-none focus:border-indigo-400"
                      />
                      <button onClick={() => handleRenameConfirm(sim.id)} className="text-emerald-400 p-1">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-rose-400 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1 truncate">{sim.name}</h3>
                  )}

                  {sim.notes && (
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed truncate">{sim.notes}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--glass-border)]">
                  <button
                    onClick={() => onLoadSimulation(sim)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Load in Simulator</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingId(sim.id);
                        setEditingName(sim.name);
                      }}
                      className="p-1.5 rounded-lg hover:bg-[var(--glass-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                      title="Rename simulation"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(sim.id)}
                      className="p-1.5 rounded-lg hover:bg-[var(--glass-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                      title="Duplicate simulation"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sim.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition"
                      title="Delete simulation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
