import React, { useState } from 'react';
import { 
  Cpu, 
  Layers, 
  HardDrive, 
  FileText, 
  ShieldAlert, 
  RefreshCw, 
  Compass, 
  GitCompare, 
  Bookmark, 
  Settings, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Activity, 
  FolderTree, 
  Binary, 
  CheckCircle2, 
  Home,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { UserPreferences } from '../../storage/db';

export interface NavItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  badge?: string;
}

interface AppShellProps {
  currentNav: string;
  onNavigate: (navId: string) => void;
  preferences: UserPreferences;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Simulation Home', shortLabel: 'Home', icon: <Home className="w-4 h-4" /> },
  { id: 'cpu', label: 'CPU Scheduling', shortLabel: 'CPU', icon: <Cpu className="w-4 h-4" />, badge: '6' },
  { id: 'process', label: 'Process Lifecycle & PCB', shortLabel: 'Process', icon: <Activity className="w-4 h-4" /> },
  { id: 'memory', label: 'Memory Allocation', shortLabel: 'Memory', icon: <Layers className="w-4 h-4" />, badge: 'Buddy' },
  { id: 'paging', label: 'Paging & Replacement', shortLabel: 'Paging', icon: <FileText className="w-4 h-4" /> },
  { id: 'segmentation', label: 'Segmentation Visualizer', shortLabel: 'Segment', icon: <Binary className="w-4 h-4" /> },
  { id: 'deadlock', label: 'Deadlock & Banker’s', shortLabel: 'Deadlock', icon: <ShieldAlert className="w-4 h-4" />, badge: 'RAG' },
  { id: 'sync', label: 'Process Synchronization', shortLabel: 'Sync', icon: <RefreshCw className="w-4 h-4" /> },
  { id: 'disk', label: 'Disk Head Scheduling', shortLabel: 'Disk', icon: <HardDrive className="w-4 h-4" />, badge: '6' },
  { id: 'filesystem', label: 'Virtual File System', shortLabel: 'Files', icon: <FolderTree className="w-4 h-4" /> },
  { id: 'mechanisms', label: 'OS Mechanisms & Dual Mode', shortLabel: 'Kernel', icon: <Compass className="w-4 h-4" /> },
  { id: 'compare', label: 'Compare Algorithms', shortLabel: 'Compare', icon: <GitCompare className="w-4 h-4" /> },
  { id: 'tests', label: 'Automated Tests', shortLabel: 'Tests', icon: <CheckCircle2 className="w-4 h-4" />, badge: '10' },
  { id: 'saved', label: 'Saved Simulations', shortLabel: 'Saved', icon: <Bookmark className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings & Android Guide', shortLabel: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

export const AppShell: React.FC<AppShellProps> = ({
  currentNav,
  onNavigate,
  preferences,
  onToggleTheme,
  children
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={`min-h-screen flex flex-col ${preferences.lowMotion ? 'low-motion' : ''}`}>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full glass-panel-elevated border-b border-[var(--glass-border)] px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Desktop sidebar collapse toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:flex p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
            title="Toggle sidebar navigation"
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {/* Brand Logo & Name */}
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4F80FF] via-[#2DD4BF] to-[#906DF7] p-0.5 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#070B14] rounded-[10px] flex items-center justify-center font-extrabold text-xs tracking-wider text-white">
                OS
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">OS Lab</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-teal-500/15 text-teal-600 dark:text-[#2DD4BF] border border-teal-500/30 font-bold">
                  v2.0
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Simulation Select Dropdown */}
          <div className="hidden lg:block">
            <select
              value={currentNav}
              onChange={(e) => onNavigate(e.target.value)}
              className="bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[#4F80FF] cursor-pointer shadow-sm"
            >
              {NAV_ITEMS.map((item) => (
                <option key={item.id} value={item.id} className="bg-slate-900 text-white">
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer shadow-sm"
            title="Toggle Dark / Light theme"
          >
            {preferences.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-[#4F80FF]" />
            )}
          </button>

          {/* Settings Shortcut */}
          <button
            onClick={() => onNavigate('settings')}
            className={`p-2 rounded-xl border transition cursor-pointer shadow-sm ${
              currentNav === 'settings'
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-600 dark:text-[#4F80FF]'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Settings & Android Packaging"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Collapsible Sidebar */}
        <aside
          className={`hidden md:flex flex-col border-r border-[var(--glass-border)] glass-panel transition-all duration-300 shrink-0 ${
            isSidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = currentNav === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/15 via-teal-500/10 to-transparent dark:from-[#4F80FF]/25 dark:via-[#2DD4BF]/15 border border-blue-500/30 dark:border-[#4F80FF]/40 text-[var(--text-primary)] font-semibold shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent'
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span
                      className={`shrink-0 transition-transform ${
                        isActive
                          ? 'text-[#2DD4BF] scale-110 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]'
                          : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {isSidebarOpen && (
                      <span className="text-xs truncate tracking-tight">{item.label}</span>
                    )}
                  </div>

                  {isSidebarOpen && item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-white/10 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          {isSidebarOpen && (
            <div className="p-4 border-t border-[var(--glass-border)] text-[11px] font-mono text-[var(--text-muted)] space-y-1">
              <div className="text-[var(--text-secondary)] font-semibold">OS Lab Simulator</div>
              <div className="text-[10px]">Deterministic Core • Reversible State</div>
            </div>
          )}
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-md flex flex-col p-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <span className="font-bold text-white text-base">Navigation</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 text-white/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left text-xs font-mono flex items-center justify-between ${
                    currentNav === item.id
                      ? 'bg-[#4F80FF]/20 border border-[#4F80FF] text-white font-bold'
                      : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-transparent">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden sticky bottom-0 z-40 w-full glass-panel-elevated border-t border-[var(--glass-border)] px-2 py-2 flex items-center justify-around text-[10px] font-mono">
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-1 ${
            currentNav === 'home' ? 'text-[#2DD4BF] font-bold' : 'text-[var(--text-muted)]'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => onNavigate('cpu')}
          className={`flex flex-col items-center gap-1 ${
            currentNav === 'cpu' ? 'text-[#4F80FF] font-bold' : 'text-[var(--text-muted)]'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>CPU</span>
        </button>

        <button
          onClick={() => onNavigate('memory')}
          className={`flex flex-col items-center gap-1 ${
            currentNav === 'memory' ? 'text-[#906DF7] font-bold' : 'text-[var(--text-muted)]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Memory</span>
        </button>

        <button
          onClick={() => onNavigate('compare')}
          className={`flex flex-col items-center gap-1 ${
            currentNav === 'compare' ? 'text-[#EC4899] font-bold' : 'text-[var(--text-muted)]'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span>Compare</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 text-[var(--text-muted)]"
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
};
