export interface SavedSimulationItem {
  id: string;
  name: string;
  domain: 'cpu' | 'memory' | 'paging' | 'segmentation' | 'deadlock' | 'sync' | 'disk' | 'filesystem';
  algorithm: string;
  createdAt: string;
  config: any;
  notes?: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  playbackSpeed: number;
  lowMotion: boolean;
  soundEnabled: boolean;
}

const STORAGE_KEY_PREFS = 'oslab_user_preferences_v1';
const STORAGE_KEY_SAVED = 'oslab_saved_simulations_v1';

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  playbackSpeed: 1.0,
  lowMotion: false,
  soundEnabled: false
};

// Safe IndexedDB / LocalStorage persistence
export function getSavedSimulations(): SavedSimulationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSimulation(item: Omit<SavedSimulationItem, 'id' | 'createdAt'>): SavedSimulationItem {
  const current = getSavedSimulations();
  const newItem: SavedSimulationItem = {
    ...item,
    id: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString()
  };
  const updated = [newItem, ...current];
  localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
  return newItem;
}

export function deleteSavedSimulation(id: string): void {
  const current = getSavedSimulations();
  const updated = current.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
}

export function duplicateSavedSimulation(id: string): SavedSimulationItem | null {
  const current = getSavedSimulations();
  const target = current.find(item => item.id === id);
  if (!target) return null;

  const duplicated: SavedSimulationItem = {
    ...target,
    id: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: `${target.name} (Copy)`,
    createdAt: new Date().toISOString()
  };
  const updated = [duplicated, ...current];
  localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
  return duplicated;
}

export function renameSavedSimulation(id: string, newName: string): void {
  const current = getSavedSimulations();
  const item = current.find(i => i.id === id);
  if (item) {
    item.name = newName;
    localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(current));
  }
}

export function getStoredPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveStoredPreferences(prefs: Partial<UserPreferences>): UserPreferences {
  const current = getStoredPreferences();
  const updated = { ...current, ...prefs };
  localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(updated));
  return updated;
}

// Export / Import Helpers
export function exportSimulationsToJSON(): string {
  const data = {
    formatVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    generator: 'OS Lab Simulator',
    simulations: getSavedSimulations(),
    preferences: getStoredPreferences()
  };
  return JSON.stringify(data, null, 2);
}

export function importSimulationsFromJSON(jsonString: string): { success: boolean; importedCount: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.simulations)) {
      return { success: false, importedCount: 0, error: 'Invalid file format: Missing "simulations" array.' };
    }

    const current = getSavedSimulations();
    const importedList: SavedSimulationItem[] = parsed.simulations.map((item: any) => ({
      ...item,
      id: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: item.createdAt || new Date().toISOString()
    }));

    const combined = [...importedList, ...current];
    localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(combined));
    return { success: true, importedCount: importedList.length };
  } catch (err: any) {
    return { success: false, importedCount: 0, error: err.message || 'Failed to parse JSON file.' };
  }
}
