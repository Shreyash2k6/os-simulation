import React from 'react';
import { Shield, Cpu, ArrowDown, ArrowUp, Lock, Zap } from 'lucide-react';

interface PrivilegeRingsGraphicProps {
  cpuRing: string;
  action: string;
  location: string;
  explanation: string;
}

export const PrivilegeRingsGraphic: React.FC<PrivilegeRingsGraphicProps> = ({
  cpuRing,
  action,
  location,
  explanation,
}) => {
  const isRing0 = cpuRing.includes('Ring 0');
  const isRing3 = cpuRing.includes('Ring 3');

  return (
    <div className="glass-panel-elevated rounded-2xl p-5 border border-[var(--glass-border)] space-y-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">x86_64 Dual Mode Hardware Privilege Rings</h2>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Concentric protection domains: Ring 3 (User Space) vs Ring 0 (Kernel Supervisor)
            </p>
          </div>
        </div>
        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
          isRing0
            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm shadow-rose-500/20'
            : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
        }`}>
          {isRing0 ? <Lock className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
          CURRENT CPU MODE: {cpuRing}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG Concentric Rings Radar */}
        <div className="lg:col-span-6 flex justify-center p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] shadow-inner">
          <svg viewBox="0 0 320 320" className="w-full max-w-[280px] h-auto select-none">
            {/* Outer Ring 3: User Space */}
            <circle
              cx="160"
              cy="160"
              r="140"
              fill={isRing3 ? '#162447' : '#0B1120'}
              stroke={isRing3 ? '#4F80FF' : 'rgba(255,255,255,0.1)'}
              strokeWidth={isRing3 ? '3' : '1.5'}
              className="transition-all duration-300"
            />
            <text x="160" y="38" textAnchor="middle" fill={isRing3 ? '#4F80FF' : '#64748B'} fontSize="10" fontFamily="monospace" fontWeight="bold">
              RING 3: USER SPACE (CPL = 3)
            </text>

            {/* Middle Ring 2 & 1 */}
            <circle
              cx="160"
              cy="160"
              r="100"
              fill="#0B132B"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <text x="160" y="76" textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="monospace">
              Ring 1 & 2: Device Drivers
            </text>

            {/* Inner Ring 0: Supervisor Kernel */}
            <circle
              cx="160"
              cy="160"
              r="65"
              fill={isRing0 ? '#2E111A' : '#14142B'}
              stroke={isRing0 ? '#F43F5E' : 'rgba(255,255,255,0.2)'}
              strokeWidth={isRing0 ? '3.5' : '1.5'}
              className="transition-all duration-300"
            />
            <text x="160" y="155" textAnchor="middle" fill={isRing0 ? '#F43F5E' : '#94A3B8'} fontSize="11" fontFamily="monospace" fontWeight="bold">
              RING 0
            </text>
            <text x="160" y="170" textAnchor="middle" fill={isRing0 ? '#F43F5E' : '#64748B'} fontSize="8" fontFamily="monospace">
              KERNEL CORE
            </text>

            {/* Active CPU Pointer Beacon */}
            <circle
              cx="160"
              cy={isRing0 ? 160 : 38}
              r="8"
              fill={isRing0 ? '#F43F5E' : '#4F80FF'}
              stroke="#FFFFFF"
              strokeWidth="2"
              className="shadow-[0_0_15px_currentColor] animate-ping"
            />
          </svg>
        </div>

        {/* Transition Explanation */}
        <div className="lg:col-span-6 space-y-3 font-mono text-xs">
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] space-y-2 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-cyan-400">Trap / Syscall Mechanism:</div>
            <div className="text-sm font-bold text-[var(--text-primary)]">{action}</div>
            <div className="text-[11px] text-[var(--text-secondary)]">{location}</div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pt-1 border-t border-[var(--glass-border)]">
              {explanation}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-[11px] space-y-1">
            <span className="text-indigo-400 font-bold block">Why Anyone Needs This:</span>
            <span className="text-[var(--text-secondary)]">
              User apps running in Ring 3 cannot execute privileged CPU instructions (like writing to raw hard disk sectors). They execute the <code className="text-cyan-400">syscall</code> assembly instruction which triggers a hardware trap into Ring 0, where the kernel securely executes the request and returns.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
