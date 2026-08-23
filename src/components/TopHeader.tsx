import React, { useState } from 'react';
import {
  Menu,
  Globe,
  ChevronDown,
  Plus
} from 'lucide-react';
import { Website, NavTab } from '../types';

interface TopHeaderProps {
  activeTab: NavTab;
  onOpenMobileSidebar: () => void;
  websites: Website[];
  activeWebsite: Website | undefined;
  onSelectWebsite: (id: string) => void;
  onNavigateToTab: (tab: NavTab) => void;
}

const TAB_METADATA: Record<NavTab, { title: string; subtitle: string; category: string }> = {
  dashboard: {
    title: 'Overview Dashboard',
    subtitle: 'High-level traffic, organic clicks, SERP ranks, and urgent action items',
    category: 'SEO Intelligence'
  },
  optimization_pipeline: {
    title: 'Optimization Pipeline',
    subtitle: 'Track optimized pages, multi-activity milestone dates, and verify before-and-after traffic lift',
    category: 'SEO Intelligence'
  },
  declining_pages: {
    title: 'Declining Pages Analysis',
    subtitle: 'Decay detection, root cause diagnostics, and traffic recovery planner',
    category: 'SEO Intelligence'
  },
  all_pages: {
    title: 'All Submitted Pages',
    subtitle: 'Google Search Console index coverage, crawl diagnostics, and zero-traffic discovery',
    category: 'SEO Intelligence'
  },
  keywords: {
    title: 'Keyword Tracking & SERP',
    subtitle: 'Bright Data SERP API tracking, position trends, and search features',
    category: 'SEO Intelligence'
  },
  insights: {
    title: 'Diagnostic Insights',
    subtitle: 'Automated heuristics identifying quick-win pages and keyword cannibalization',
    category: 'SEO Intelligence'
  },
  activities: {
    title: 'Monthly Activity Planner',
    subtitle: 'Actionable SEO sprints, content refreshes, and technical fixes',
    category: 'Execution & Strategy'
  },
  reports: {
    title: 'Executive Monthly Reports',
    subtitle: 'Executive summaries, traffic matrices, and printable HTML snapshots',
    category: 'Execution & Strategy'
  },
  connections: {
    title: 'Google API Integrations',
    subtitle: 'Google Analytics 4 & Search Console credentials and sync status',
    category: 'Execution & Strategy'
  },
  websites: {
    title: 'Website Portfolio',
    subtitle: 'Manage monitored domains, decay thresholds, country & device settings',
    category: 'System & Tools'
  },
  category_rules: {
    title: 'URL Category & Classification Rules',
    subtitle: 'Assign regex, prefix patterns, and custom page classifications',
    category: 'System & Tools'
  },
  sync_logs: {
    title: 'Sync & Cron Logs',
    subtitle: 'Audit trail of automatic midnight syncs, rank tracking, and API run history',
    category: 'System & Tools'
  },
  deployment: {
    title: 'Deployment & Web Installer',
    subtitle: 'PHP 8.2+ deployment package, Apache configurations, and self-hosted installer wizard',
    category: 'System & Tools'
  },
  code_package: {
    title: 'PHP 8.2+ Deployment Package',
    subtitle: 'Pure PHP 8.2+ backend source code, migrations, and zero-dependency ZIP',
    category: 'System & Tools'
  },
  settings: {
    title: 'System Settings',
    subtitle: 'Global timezone, AI tool API credentials, email alerts, and thresholds',
    category: 'System & Tools'
  },
  installer: {
    title: 'Web Installer Wizard',
    subtitle: 'Step-by-step shared hosting environment verification and database bootstrap',
    category: 'System & Tools'
  }
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  websites,
  activeWebsite,
  onSelectWebsite,
  onNavigateToTab
}) => {
  const [showSiteMenu, setShowSiteMenu] = useState(false);
  const currentMeta = TAB_METADATA[activeTab] || {
    title: 'Dashboard',
    subtitle: 'SEO Management Platform',
    category: 'Sitelift'
  };

  return (
    <header className="sticky top-0 z-40 shrink-0 bg-[#0f172a]/95 border-b border-white/10 backdrop-blur-2xl px-4 sm:px-6 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left Side: Mobile Hamburger & Current View Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
            title="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-indigo-400 font-medium">{currentMeta.category}</span>
              <span>/</span>
              <span className="text-slate-200 font-semibold truncate">{currentMeta.title}</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
              {currentMeta.title}
            </h1>
          </div>
        </div>

        {/* Right Side: Shifted Target Website Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          
          <div className="relative">
            <button
              onClick={() => setShowSiteMenu(!showSiteMenu)}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-md transition-all shadow-sm ${
                showSiteMenu
                  ? 'bg-indigo-600 border border-indigo-500/40 text-white shadow-indigo-600/30'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200'
              }`}
              title="Target Monitored Website"
            >
              <div className="w-5 h-5 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                {activeWebsite ? activeWebsite.name.charAt(0) : 'W'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block font-semibold text-white truncate max-w-[140px]">
                  {activeWebsite ? activeWebsite.name : 'Select Website'}
                </span>
                <span className="block text-[10px] text-slate-400 font-mono -mt-0.5 truncate max-w-[140px]">
                  {activeWebsite?.domain || 'no domain'}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${showSiteMenu ? 'rotate-180 text-white' : ''}`} />
            </button>

            {showSiteMenu && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setShowSiteMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-[10px] font-bold text-slate-400 px-2.5 py-1 uppercase tracking-wider flex items-center justify-between">
                    <span>Switch Target Website</span>
                    <span className="text-[9px] text-slate-500 font-mono">{websites.length} total</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1 my-1.5 custom-scrollbar pr-1">
                    {websites.map(site => (
                      <button
                        key={site.id}
                        onClick={() => {
                          onSelectWebsite(site.id);
                          setShowSiteMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-all ${
                          activeWebsite?.id === site.id
                            ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                            : 'text-slate-200 hover:bg-white/10 bg-slate-900/60'
                        }`}
                      >
                        <div className="truncate mr-2 min-w-0">
                          <div className="font-medium truncate">{site.name}</div>
                          <div className={`text-[10px] truncate font-mono ${activeWebsite?.id === site.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {site.domain} • <span className="uppercase">{site.targetCountry || 'US'}</span> ({site.targetDevice || 'desktop'})
                          </div>
                        </div>
                        {activeWebsite?.id === site.id && (
                          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-800 pt-2 px-1">
                    <button
                      onClick={() => {
                        onNavigateToTab('websites');
                        setShowSiteMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-white/5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Manage All Websites</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
