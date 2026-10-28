import React, { useState } from 'react';
import { SegmentDescriptor, SegmentationTranslationResult } from '../../engine/segmentation/types';
import { translateSegmentAddress, DEFAULT_SEGMENTS } from '../../engine/segmentation/segmenter';
import { MmuSegmentationGraphic } from '../graphics/MmuSegmentationGraphic';
import { Binary, ShieldAlert, CheckCircle2, ArrowRight, RotateCcw, Plus, Trash2, Cpu } from 'lucide-react';

export const SegmentationView: React.FC = () => {
  const [segments, setSegments] = useState<SegmentDescriptor[]>(DEFAULT_SEGMENTS);
  const [inputSegment, setInputSegment] = useState<number>(0);
  const [inputOffset, setInputOffset] = useState<number>(450);

  const translation: SegmentationTranslationResult = translateSegmentAddress(
    inputSegment,
    inputOffset,
    segments
  );

  const handleUpdateSegment = (index: number, field: keyof SegmentDescriptor, val: any) => {
    const updated = [...segments];
    updated[index] = { ...updated[index], [field]: val };
    setSegments(updated);
  };

  const handleAddSegment = () => {
    const nextNum = segments.length;
    const last = segments[segments.length - 1];
    const newBase = last ? last.baseAddress + last.limit + 200 : 1000;
    setSegments([
      ...segments,
      {
        segmentNumber: nextNum,
        name: `Custom Segment ${nextNum}`,
        baseAddress: newBase,
        limit: 500,
        permissions: 'rw-',
        color: '#4F80FF'
      }
    ]);
  };

  const handleDeleteSegment = (index: number) => {
    if (segments.length <= 1) return;
    setSegments(segments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-5 border border-[var(--glass-border)] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-semibold tracking-wider uppercase mb-1">
            <span className="p-1 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Binary className="w-3.5 h-3.5" />
            </span>
            <span>Memory Architecture & Protection</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Segmentation & Bounds Verification</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Interactive Segment Table (STBR / STLR) limit verification, physical translation, and segmentation fault hardware trap handling.
          </p>
        </div>

        <button
          onClick={() => setSegments(DEFAULT_SEGMENTS)}
          className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono flex items-center gap-1.5 transition shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Segment Table</span>
        </button>
      </div>

      {/* Interactive Hardware Segmentation MMU Unit Graphic */}
      <MmuSegmentationGraphic
        segmentNumber={inputSegment}
        offset={inputOffset}
        translation={translation}
      />

      {/* Main 2-Column: Segment Table on Left, Address Translation on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Segment Table Editor */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-5 border border-[var(--glass-border)] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                Active Segment Table (STBR / STLR)
              </h2>
              <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                Logical segments mapped to base and limit registers
              </span>
            </div>
            <button
              onClick={handleAddSegment}
              className="px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-400 text-xs font-semibold flex items-center gap-1 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Segment</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[var(--glass-border)] text-[var(--text-secondary)] text-[11px] uppercase">
                  <th className="pb-2.5">Seg #</th>
                  <th className="pb-2.5">Name / Purpose</th>
                  <th className="pb-2.5">Base Address</th>
                  <th className="pb-2.5">Limit (Length)</th>
                  <th className="pb-2.5">Perms</th>
                  <th className="pb-2.5 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {segments.map((seg, idx) => (
                  <tr
                    key={seg.segmentNumber}
                    className={`transition-colors ${
                      inputSegment === seg.segmentNumber ? 'bg-purple-500/10 font-bold' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-2.5 font-bold text-purple-400">
                      {seg.segmentNumber}
                    </td>
                    <td className="py-2.5">
                      <input
                        type="text"
                        value={seg.name}
                        onChange={(e) => handleUpdateSegment(idx, 'name', e.target.value)}
                        className="bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded px-2 py-1 text-[var(--text-primary)] w-32 text-xs focus:border-purple-400 outline-none"
                      />
                    </td>
                    <td className="py-2.5">
                      <input
                        type="number"
                        min="0"
                        value={seg.baseAddress}
                        onChange={(e) => handleUpdateSegment(idx, 'baseAddress', parseInt(e.target.value) || 0)}
                        className="bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded px-2 py-1 text-[var(--text-primary)] w-20 text-xs focus:border-purple-400 outline-none"
                      />
                    </td>
                    <td className="py-2.5">
                      <input
                        type="number"
                        min="1"
                        value={seg.limit}
                        onChange={(e) => handleUpdateSegment(idx, 'limit', parseInt(e.target.value) || 1)}
                        className="bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded px-2 py-1 text-[var(--text-primary)] w-20 text-xs focus:border-purple-400 outline-none"
                      />
                    </td>
                    <td className="py-2.5 text-[var(--text-secondary)]">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-[10px] font-semibold">{seg.permissions || 'rw-'}</span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleDeleteSegment(idx)}
                        className="p-1 rounded hover:bg-rose-500/20 text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Address Translation Tester */}
        <div className="lg:col-span-5 glass-panel-elevated rounded-2xl p-5 border border-[var(--glass-border)] space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>MMU Hardware Translation</span>
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--glass-border)]">
              Limit Check
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <label className="text-[var(--text-secondary)] block mb-1 font-semibold">Segment Number (s)</label>
              <select
                value={inputSegment}
                onChange={(e) => setInputSegment(parseInt(e.target.value))}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-[var(--text-primary)] outline-none focus:border-cyan-400 transition"
              >
                {segments.map((s) => (
                  <option key={s.segmentNumber} value={s.segmentNumber}>
                    Seg {s.segmentNumber}: {s.name} (Limit {s.limit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[var(--text-secondary)] block mb-1 font-semibold">Offset (d)</label>
              <input
                type="number"
                value={inputOffset}
                onChange={(e) => setInputOffset(parseInt(e.target.value) || 0)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-[var(--text-primary)] outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          {/* Translation Result Card */}
          <div
            className={`p-4 rounded-xl border transition-all shadow-md ${
              translation.isValid
                ? 'bg-emerald-500/10 border-emerald-500/40 shadow-emerald-500/10'
                : 'bg-rose-500/15 border-rose-500/50 shadow-rose-500/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--text-primary)]">
                MMU Translation Status
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  translation.isValid
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                }`}
              >
                {translation.isValid ? 'VALID ADDRESS' : 'SEGMENTATION FAULT'}
              </span>
            </div>

            {translation.isValid ? (
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Base Address:</span>
                  <span className="text-[var(--text-primary)] font-bold">{translation.baseAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Valid Offset Range:</span>
                  <span className="text-[var(--text-primary)]">0 to {translation.limit! - 1}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-emerald-500/20 items-center">
                  <span className="text-emerald-400 font-bold">Physical Memory Address:</span>
                  <span className="text-cyan-400 font-extrabold text-base bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded">
                    {translation.physicalAddress}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Access Violation: {translation.error}</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  The memory management unit (MMU) detected an illegal address access: offset (d) exceeds the segment limit. Hardware raised a trap to operating system kernel (SIGSEGV).
                </p>
              </div>
            )}
          </div>

          {/* Step-by-Step Translation Logic Breakdown */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-[var(--text-primary)] font-mono">MMU Translation Verification:</span>
            {translation.steps.map((st, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-xs font-mono flex items-start gap-2 shadow-sm"
              >
                {st.status === 'pass' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-[var(--text-primary)] font-semibold">{st.title}</div>
                  <div className="text-[var(--text-secondary)] text-[11px]">{st.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
