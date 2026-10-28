/**
 * Core simulation types and timeline state management
 */

export interface TimelineState {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number; // 0.25, 0.5, 1, 2, 4
  canStepBack: boolean;
  canStepForward: boolean;
}

export interface SimulationLogEntry {
  step: number;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'context-switch' | 'allocation' | 'page-fault' | 'page-hit';
  message: string;
  details?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
