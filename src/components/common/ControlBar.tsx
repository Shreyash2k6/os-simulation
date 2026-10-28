import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, FastForward } from 'lucide-react';

interface ControlBarProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  canStepBack: boolean;
  canStepForward: boolean;
  onPlayPause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onScrub?: (step: number) => void;
  statusLabel?: string;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  canStepBack,
  canStepForward,
  onPlayPause,
  onStepBack,
  onStepForward,
  onReset,
  onSpeedChange,
  onScrub,
  statusLabel
}) => {
  const speeds = [0.25, 0.5, 1, 2, 4];

  return (
    <div className="w-full glass-panel-elevated rounded-2xl p-3 sm:p-4 border border-[var(--glass-border)] shadow-xl transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Playback Button Group */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Reset */}
          <button
            onClick={onReset}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Reset simulation to initial state (t=0)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Step Back */}
          <button
            onClick={onStepBack}
            disabled={!canStepBack}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-medium ${
              canStepBack
                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border-slate-200 dark:border-white/10 text-[var(--text-primary)] cursor-pointer'
                : 'bg-slate-100/50 dark:bg-white/[0.02] text-[var(--text-muted)] border-slate-100 dark:border-white/5 opacity-40 cursor-not-allowed'
            }`}
            title="Step backward one recorded state"
          >
            <SkipBack className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={onPlayPause}
            className={`px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-500 dark:text-amber-300 hover:bg-amber-500/30'
                : 'aurora-btn-primary'
            }`}
            title={isPlaying ? 'Pause simulation execution' : 'Play simulation automatically'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{currentStep >= totalSteps && totalSteps > 0 ? 'Replay' : 'Play'}</span>
              </>
            )}
          </button>

          {/* Step Forward */}
          <button
            onClick={onStepForward}
            disabled={!canStepForward}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-medium ${
              canStepForward
                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border-slate-200 dark:border-white/10 text-[var(--text-primary)] cursor-pointer'
                : 'bg-slate-100/50 dark:bg-white/[0.02] text-[var(--text-muted)] border-slate-100 dark:border-white/5 opacity-40 cursor-not-allowed'
            }`}
            title="Step forward one event"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Step</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 ml-1 sm:ml-2 pl-2 border-l border-slate-200 dark:border-white/10">
            <FastForward className="w-3.5 h-3.5 text-[var(--text-muted)] hidden sm:block" />
            <div className="flex bg-slate-100 dark:bg-black/30 rounded-lg p-0.5 border border-slate-200 dark:border-white/10">
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => onSpeedChange(s)}
                  className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-[11px] font-mono transition cursor-pointer ${
                    speed === s
                      ? 'bg-[#4F80FF] text-white font-bold shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step Scrubber / Timeline Slider */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <input
            type="range"
            min={0}
            max={Math.max(1, totalSteps)}
            value={currentStep}
            onChange={(e) => onScrub && onScrub(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#2DD4BF]"
          />
          <div className="font-mono text-xs text-[var(--text-secondary)] shrink-0 min-w-[70px] text-right">
            <span className="text-[#2DD4BF] font-bold">{currentStep}</span>
            <span className="text-[var(--text-muted)]"> / {totalSteps}</span>
          </div>
        </div>
      </div>

      {statusLabel && (
        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span className="font-mono truncate">{statusLabel}</span>
          <span className="text-[#10B981] font-semibold flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            Reversible Engine
          </span>
        </div>
      )}
    </div>
  );
};
