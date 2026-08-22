import React from 'react';
import {
  Activity as ActivityIcon,
  BarChart3,
  TrendingDown,
  KeyRound,
  FileText,
  Settings,
  FolderCode,
  Globe,
  Radio,
  Clock,
  Sparkles,
  Layers,
  ChevronDown,
  Play,
  Download,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { Website } from '../types';
import { storage } from '../services/storage';

export type NavTab =
  | 'dashboard'
  | 'declining_pages'
  | 'keywords'
  | 'insights'
  | 'activities'
  | 'reports'
  | 'connections'
  | 'websites'
  | 'category_rules'
  | 'sync_logs'
  | 'code_package'
  | 'settings'
  | 'installer';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  websites: Website[];
  activeWebsite: Website | undefined;
  onSelectWebsite: (id: string) => void;
  onTriggerCron: () => void;
  isCronRunning: boolean;
  onDownloadZip: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  websites,
  activeWebsite,
  onSelectWebsite,
  onTriggerCron,
  isCronRunning,
  onDownloadZip,
  onLogout
}) => {
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);
  const [showSiteMenu, setShowSiteMenu] = React.useState(false);
  const authUser = storage.getAuthUser();

  const primaryNavItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'declining_pages', label: 'Declining Pages', icon: TrendingDown },
    { id: 'keywords', label: 'Keywords', icon: KeyRound },
    { id: 'insights', label: 'Insights', icon: Sparkles },
    { id: 'activities', label: 'Activities', icon: ActivityIcon },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'connections', label: 'Connections', icon: Radio }
  ];

  const secondaryNavItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'websites', label: 'All Websites', icon: Globe },
    { id: 'category_rules', label: 'Category Rules', icon: Layers },
    { id: 'sync_logs', label: 'Sync & Cron Logs', icon: Clock },
    { id: 'code_package', label: 'Deploy & PHP ZIP', icon: FolderCode },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'installer', label: 'Web Installer Wizard', icon: ShieldCheck }
  ];

  return (
    <header className="bg-white/5 border-b border-white/10 backdrop-blur-xl text-slate-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg transition-transform active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              S
            </div>
            <span className="font-bold text-lg tracking-tight text-white">Sitelift</span>
          </button>

          {/* Active Site Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSiteMenu(!showSiteMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-slate-200 backdrop-blur-md transition-all"
              title="Switch Active Website"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="max-w-[140px] truncate">{activeWebsite ? activeWebsite.name : 'Select Site'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {showSiteMenu && (
              <div
                className="absolute left-0 mt-2 w-56 bg-[#0f172a]/95 border border-white/15 backdrop-blur-2xl rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in duration-100"
                onClick={() => setShowSiteMenu(false)}
              >
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Select Website
                </div>
                {websites.map(site => (
                  <button
                    key={site.id}
                    onClick={() => onSelectWebsite(site.id)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-white/10 transition-colors ${
                      activeWebsite?.id === site.id ? 'text-indigo-400 font-semibold bg-white/5' : 'text-slate-200'
                    }`}
                  >
                    <span className="truncate">{site.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded capitalize font-medium ${
                        site.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {site.status}
                    </span>
                  </button>
                ))}
                <div className="border-t border-white/10 mt-1 pt-1">
                  <button
                    onClick={() => onSelectTab('websites')}
                    className="w-full text-left px-3 py-1.5 text-xs text-indigo-400 hover:bg-white/10 font-medium"
                  >
                    + Manage Websites
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zone 2: Navigation Links (single line, max 7) */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
          {primaryNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white/15 text-white border border-white/20 shadow-sm backdrop-blur-md font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* More Menu for Secondary Sections */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                secondaryNavItems.some(i => i.id === activeTab)
                  ? 'bg-white/15 text-white border border-white/20 shadow-sm backdrop-blur-md font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>More</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showMoreMenu && (
              <div
                className="absolute right-0 mt-2 w-52 bg-[#0f172a]/95 border border-white/15 backdrop-blur-2xl rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in duration-100"
                onClick={() => setShowMoreMenu(false)}
              >
                {secondaryNavItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/10 transition-colors ${
                        activeTab === item.id ? 'text-indigo-400 font-semibold bg-white/5' : 'text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Cron Trigger */}
          <button
            onClick={onTriggerCron}
            disabled={isCronRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-slate-200 backdrop-blur-md transition-all disabled:opacity-50"
            title="Execute Shared-Hosting Cron Subroutine"
          >
            <Play className={`w-3 h-3 text-indigo-400 ${isCronRunning ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isCronRunning ? 'Syncing...' : 'Run Cron'}</span>
          </button>

          {/* Download PHP Package ZIP */}
          <button
            onClick={onDownloadZip}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 backdrop-blur-md transition-all"
            title="Download Full CodeIgniter / PHP 8.2+ Deployment ZIP"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download ZIP</span>
          </button>

          {/* Admin User / Logout */}
          <div className="border-l border-white/10 pl-2 ml-1 flex items-center gap-2">
            <div className="hidden lg:block text-right">
              <div className="text-xs font-medium text-slate-200 leading-tight">{authUser?.name || 'Admin'}</div>
              <div className="text-[10px] text-indigo-400 leading-tight">Self-Hosted</div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-white/10 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
