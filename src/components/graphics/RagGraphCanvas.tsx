import React from 'react';
import { RAGGraph } from '../../engine/deadlock/types';
import { ShieldAlert, ShieldCheck, Share2, ArrowRight, Zap, Check } from 'lucide-react';

interface RagGraphCanvasProps {
  rag: RAGGraph;
  safeSequence?: string[];
  isSafe?: boolean;
}

export const RagGraphCanvas: React.FC<RagGraphCanvasProps> = ({
  rag,
  safeSequence,
  isSafe,
}) => {
  // SVG Canvas dimensions
  const width = 600;
  const height = 320;

  // Compute fixed positions for the demo processes and resources in a neat circle / bipartite layout
  const nodePositions: Record<string, { x: number; y: number }> = {
    P1: { x: 120, y: 80 },
    P2: { x: 480, y: 80 },
    P3: { x: 300, y: 260 },
    R1: { x: 300, y: 50 },
    R2: { x: 440, y: 200 },
    R3: { x: 160, y: 200 },
  };

  return (
    <div className="glass-panel-elevated rounded-2xl p-5 border border-[var(--glass-border)] space-y-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Interactive Resource Allocation Graph (RAG)</h2>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Directed wait-for graph with automated Depth-First Search cycle detection
            </p>
          </div>
        </div>
        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
          rag.hasCycle
            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
        }`}>
          {rag.hasCycle ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          {rag.hasCycle ? 'CIRCULAR WAIT DETECTED' : 'GRAPH IS CYCLE-FREE'}
        </span>
      </div>

      {/* SVG Canvas */}
      <div className="p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] flex justify-center shadow-inner">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[560px] h-auto select-none">
          <defs>
            <marker id="arrowAlloc" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#4F80FF" />
            </marker>
            <marker id="arrowReq" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#F59E0B" />
            </marker>
            <marker id="arrowCycle" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#F43F5E" />
            </marker>
          </defs>

          {/* Edges */}
          {rag.edges.map((edge) => {
            const fromPos = nodePositions[edge.from] || { x: 50, y: 50 };
            const toPos = nodePositions[edge.to] || { x: 200, y: 200 };
            const isCycleEdge = rag.hasCycle && rag.cycleNodes.includes(edge.from) && rag.cycleNodes.includes(edge.to);

            return (
              <g key={edge.id}>
                <line
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke={isCycleEdge ? '#F43F5E' : edge.type === 'allocation' ? '#4F80FF' : '#F59E0B'}
                  strokeWidth={isCycleEdge ? '3' : '2'}
                  strokeDasharray={edge.type === 'request' ? '5 3' : 'none'}
                  markerEnd={isCycleEdge ? 'url(#arrowCycle)' : edge.type === 'allocation' ? 'url(#arrowAlloc)' : 'url(#arrowReq)'}
                  className={isCycleEdge ? 'animate-pulse' : ''}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {rag.nodes.map((node) => {
            const pos = nodePositions[node.id] || { x: 100, y: 100 };
            const isCycleNode = rag.cycleNodes.includes(node.id);
            const isProc = node.type === 'process';

            if (isProc) {
              return (
                <g key={node.id} className="transition-all">
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="22"
                    fill={isCycleNode ? '#3B1522' : '#151E35'}
                    stroke={isCycleNode ? '#F43F5E' : '#4F80FF'}
                    strokeWidth="2.5"
                    className="shadow-lg"
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {node.id}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 34}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    Process
                  </text>
                </g>
              );
            } else {
              return (
                <g key={node.id} className="transition-all">
                  <rect
                    x={pos.x - 22}
                    y={pos.y - 22}
                    width="44"
                    height="44"
                    rx="8"
                    fill={isCycleNode ? '#3B1522' : '#0E2228'}
                    stroke={isCycleNode ? '#F43F5E' : '#2DD4BF'}
                    strokeWidth="2.5"
                    className="shadow-lg"
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {node.id}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 34}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    Resource ({node.instances || 1})
                  </text>
                </g>
              );
            }
          })}
        </svg>
      </div>

      {/* Legend & Safe Sequence Vector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono pt-1">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span className="w-3 h-0.5 bg-[#4F80FF]" /> Allocation (Hold)
          </span>
          <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span className="w-3 h-0.5 border-t border-dashed border-[#F59E0B]" /> Request (Wait)
          </span>
          {rag.hasCycle && (
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span className="w-3 h-0.5 bg-rose-500" /> Cycle Deadlock Path
            </span>
          )}
        </div>

        {safeSequence && isSafe && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
            <Check className="w-3.5 h-3.5" />
            <span>Safe Sequence: &lt; {safeSequence.join(' → ')} &gt;</span>
          </div>
        )}
      </div>
    </div>
  );
};
