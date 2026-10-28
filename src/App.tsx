/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { HomeView } from './components/views/HomeView';
import { CpuSchedulingView } from './components/views/CpuSchedulingView';
import { ProcessManagementView } from './components/views/ProcessManagementView';
import { MemoryAllocationView } from './components/views/MemoryAllocationView';
import { PagingView } from './components/views/PagingView';
import { SegmentationView } from './components/views/SegmentationView';
import { DeadlockView } from './components/views/DeadlockView';
import { SynchronizationView } from './components/views/SynchronizationView';
import { DiskSchedulingView } from './components/views/DiskSchedulingView';
import { FileSystemView } from './components/views/FileSystemView';
import { OSMechanismsView } from './components/views/OSMechanismsView';
import { CompareWorkspaceView } from './components/views/CompareWorkspaceView';
import { TestLabView } from './components/views/TestLabView';
import { SavedSimulationsView } from './components/views/SavedSimulationsView';
import { SettingsView } from './components/views/SettingsView';
import { 
  getStoredPreferences, 
  saveStoredPreferences, 
  UserPreferences, 
  SavedSimulationItem 
} from './storage/db';

export default function App() {
  const [currentNav, setCurrentNav] = useState<string>('home');
  const [preferences, setPreferences] = useState<UserPreferences>(() => getStoredPreferences());

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.theme);
    if (preferences.theme === 'light') {
      document.body.classList.remove('bg-[#080C18]');
      document.body.classList.add('bg-[#F4F7FB]');
    } else {
      document.body.classList.remove('bg-[#F4F7FB]');
      document.body.classList.add('bg-[#080C18]');
    }
  }, [preferences.theme]);

  const handleUpdatePreferences = (updated: Partial<UserPreferences>) => {
    const next = saveStoredPreferences(updated);
    setPreferences(next);
  };

  const handleToggleTheme = () => {
    handleUpdatePreferences({
      theme: preferences.theme === 'dark' ? 'light' : 'dark'
    });
  };

  const handleLoadSimulation = (sim: SavedSimulationItem) => {
    // Navigate to the target simulation domain
    setCurrentNav(sim.domain);
  };

  return (
    <AppShell
      currentNav={currentNav}
      onNavigate={(navId) => {
        setCurrentNav(navId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      preferences={preferences}
      onToggleTheme={handleToggleTheme}
    >
      {currentNav === 'home' && <HomeView onSelectNav={setCurrentNav} />}
      {currentNav === 'cpu' && <CpuSchedulingView />}
      {currentNav === 'process' && <ProcessManagementView />}
      {currentNav === 'memory' && <MemoryAllocationView />}
      {currentNav === 'paging' && <PagingView />}
      {currentNav === 'segmentation' && <SegmentationView />}
      {currentNav === 'deadlock' && <DeadlockView />}
      {currentNav === 'sync' && <SynchronizationView />}
      {currentNav === 'disk' && <DiskSchedulingView />}
      {currentNav === 'filesystem' && <FileSystemView />}
      {currentNav === 'mechanisms' && <OSMechanismsView />}
      {currentNav === 'compare' && <CompareWorkspaceView />}
      {currentNav === 'tests' && <TestLabView />}
      {currentNav === 'saved' && <SavedSimulationsView onLoadSimulation={handleLoadSimulation} />}
      {currentNav === 'settings' && (
        <SettingsView
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
        />
      )}
    </AppShell>
  );
}
