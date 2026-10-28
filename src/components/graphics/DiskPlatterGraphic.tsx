import React from 'react';
import { DiskSimulationSnapshot } from '../../engine/disk/types';
import { Compass, HardDrive, ArrowRight, Zap, Target } from 'lucide-react';

interface DiskPlatterGraphicProps {
  currentHead: number;
  minCylinder: number;
  maxCylinder: number;
  requests: number[];
  visitedCylinders: number[];
  direction: 'LEFT' | 'RIGHT';
  algorithm: string;
}

export const DiskPlatterGraphic: React.FC<DiskPlatterGraphicProps> = ({
  currentHead,
  minCylinder,
  maxCylinder,
  requests,
  visitedCylinders,
  direction,
  algorithm,
}) => {
  // Normalize head position between 0 and 1
  const range = Math.max(1, maxCylinder - minCylinder);
  const headRatio = Math.max(0, Math.min(1, (currentHead - minCylinder) / range));

  // Disk geometry: Center at (200, 200), outer track radius = 170, inner track radius = 60
  const centerX = 200;
  const centerY = 200;
  const minRadius = 55;
  const maxRadius = 175;

  // The actuator arm pivots around (30, 30)
  const pivotX = 35;
  const pivotY = 35;

  // Calculate the target head point on the radius line (at angle = 45 degrees for arm reach)
  const targetRadius = minRadius + (1 - headRatio) * (maxRadius - minRadius);
  const angleRad = (45 * Math.PI) / 180;
  const headX = centerX - targetRadius * Math.cos(angleRad);
  const headY = centerY - targetRadius * Math.sin(angleRad);

  return (
    <div className="glass-panel-elevated rounded-2xl p-5 border border-[var(--glass-border)] space-y-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Mechanical Magnetic Platter & Actuator Arm</h2>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Realistic physical drive spindle, concentric track rings, and pivot actuator seek movement
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[var(--text-secondary)]">Head Position:</span>
          <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-bold">
            Cylinder {currentHead}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG Mechanical Hard Drive Simulator */}
        <div className="lg:col-span-7 flex justify-center p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] shadow-inner">
          <svg
            viewBox="0 0 400 400"
            className="w-full max-w-[380px] h-auto drop-shadow-2xl select-none"
          >
            <defs>
              {/* Platter metallic gradient */}
              <radialGradient id="platterGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="35%" stopColor="#0F172A" />
                <stop offset="65%" stopColor="#1E293B" />
                <stop offset="90%" stopColor="#334155" />
                <stop offset="100%" stopColor="#0F172A" />
              </radialGradient>
              {/* Arm metallic gradient */}
              <linearGradient id="armGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="50%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>
            </defs>

            {/* Aluminum Drive Enclosure Chassis */}
            <rect x="15" y="15" width="370" height="370" rx="28" fill="#0B101E" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />

            {/* Rotating Platter Disc */}
            <circle cx={centerX} cy={centerY} r={maxRadius + 10} fill="url(#platterGrad)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

            {/* Concentric Magnetic Track Cylinders */}
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((frac, idx) => {
              const r = minRadius + frac * (maxRadius - minRadius);
              return (
                <circle
                  key={idx}
                  cx={centerX}
                  cy={centerY}
                  r={r}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                />
              );
            })}

            {/* Central Spindle Hub */}
            <circle cx={centerX} cy={centerY} r="32" fill="#1E293B" stroke="#4F80FF" strokeWidth="2" />
            <circle cx={centerX} cy={centerY} r="16" fill="#0F172A" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            <circle cx={centerX} cy={centerY} r="5" fill="#4F80FF" />

            {/* Request Points Dropped on Tracks */}
            {requests.map((req, idx) => {
              const reqRatio = Math.max(0, Math.min(1, (req - minCylinder) / range));
              const reqRadius = minRadius + (1 - reqRatio) * (maxRadius - minRadius);
              // Distribute requests evenly around the lower half of the platter
              const angleDeg = 120 + ((idx * 55) % 200);
              const rad = (angleDeg * Math.PI) / 180;
              const ptX = centerX + reqRadius * Math.cos(rad);
              const ptY = centerY + reqRadius * Math.sin(rad);

              const isServiced = visitedCylinders.includes(req);

              return (
                <g key={idx} className="transition-all duration-300">
                  <circle
                    cx={ptX}
                    cy={ptY}
                    r={isServiced ? 7 : 5}
                    fill={isServiced ? '#10B981' : '#F59E0B'}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="shadow-md"
                  />
                  <text
                    x={ptX}
                    y={ptY + 14}
                    textAnchor="middle"
                    fill={isServiced ? '#10B981' : '#F59E0B'}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {req}
                  </text>
                </g>
              );
            })}

            {/* Active Target Track Ring Highlight */}
            <circle
              cx={centerX}
              cy={centerY}
              r={targetRadius}
              fill="none"
              stroke="#06B6D4"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              className="animate-pulse"
            />

            {/* Actuator Arm Pivot Base */}
            <circle cx={pivotX} cy={pivotY} r="22" fill="#1E293B" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <circle cx={pivotX} cy={pivotY} r="10" fill="#334155" />

            {/* Actuator Swing Arm Bar */}
            <line
              x1={pivotX}
              y1={pivotY}
              x2={headX}
              y2={headY}
              stroke="url(#armGrad)"
              strokeWidth="7"
              strokeLinecap="round"
              className="transition-all duration-300"
            />

            {/* Electromagnetic Read/Write Head Slider */}
            <g className="transition-all duration-300">
              <circle
                cx={headX}
                cy={headY}
                r="9"
                fill="#06B6D4"
                stroke="#FFFFFF"
                strokeWidth="2"
                className="shadow-[0_0_12px_rgba(6,182,212,0.8)]"
              />
              <circle cx={headX} cy={headY} r="3" fill="#FFFFFF" />
            </g>

            {/* Outer Min & Max Track Indicators */}
            <text x="30" y="365" fill="#64748B" fontSize="10" fontFamily="monospace">
              Track {minCylinder} (Outer Ring)
            </text>
            <text x="250" y="365" fill="#64748B" fontSize="10" fontFamily="monospace">
              Track {maxCylinder} (Inner Ring)
            </text>
          </svg>
        </div>

        {/* Real-time Telemetry & Physics Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] space-y-3 shadow-sm">
            <div className="text-xs font-bold text-[var(--text-primary)] flex items-center justify-between">
              <span>Drive Actuator Telemetry</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-bold">
                {algorithm} Strategy
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-[var(--glass-border)] pb-1.5">
                <span className="text-[var(--text-secondary)]">Current Target Cylinder:</span>
                <span className="text-cyan-400 font-bold">{currentHead}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--glass-border)] pb-1.5">
                <span className="text-[var(--text-secondary)]">Sweep Direction:</span>
                <span className="text-indigo-400 font-bold">{direction === 'RIGHT' ? 'INWARD (Increasing)' : 'OUTWARD (Decreasing)'}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--glass-border)] pb-1.5">
                <span className="text-[var(--text-secondary)]">Radial Track Depth:</span>
                <span className="text-[var(--text-primary)] font-bold">{Math.round(headRatio * 100)}% depth</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-[var(--text-secondary)]">Requests Serviced:</span>
                <span className="text-emerald-400 font-bold">{visitedCylinders.length} of {requests.length}</span>
              </div>
            </div>
          </div>

          {/* Quick Understanding Guide */}
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-xs font-mono space-y-2 shadow-sm">
            <span className="text-cyan-400 font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              How to Visualize This Algorithm:
            </span>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Watch the cyan read/write head sweep across the spinning platter tracks. Golden pins represent queued I/O requests. When the arm reaches a cylinder, the pin turns green indicating data transfer completion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
