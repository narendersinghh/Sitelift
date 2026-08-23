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
    subtitle: 'Keyword tracking API rank updates, position trends, and search features',
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
    title: 'Category & Classification Rules',
    subtitle: 'Assign regex, glob wildcards, and custom page classifications',
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
    <header className="sticky top-0 z-40 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 transition-all shadow-xs">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left Side: Mobile Hamburger & Current View Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-colors"
            title="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="text-blue-600 font-semibold">{currentMeta.category}</span>
              <span>/</span>
              <span className="text-slate-800 font-semibold truncate">{currentMeta.title}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
              {currentMeta.title}
            </h1>
          </div>
        </div>

        {/* Right Side: Shifted Target Website Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          
          <div className="relative">
            <button
              onClick={() => setShowSiteMenu(!showSiteMenu)}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                showSiteMenu
                  ? 'bg-blue-600 border border-blue-700 text-white shadow-blue-600/20'
                  : 'bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800'
              }`}
              title="Target Monitored Website"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                {activeWebsite ? activeWebsite.name.charAt(0) : 'W'}
              </div>
              <div className="text-left hidden sm:block">
                <span className={`block text-xs font-bold truncate max-w-[150px] ${showSiteMenu ? 'text-white' : 'text-slate-900'}`}>
                  {activeWebsite ? activeWebsite.name : 'Select Website'}
                </span>
                <span className={`block text-[11px] font-mono -mt-0.5 truncate max-w-[150px] ${showSiteMenu ? 'text-blue-100' : 'text-slate-500'}`}>
                  {activeWebsite?.domain || 'no domain'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${showSiteMenu ? 'rotate-180 text-white' : 'text-slate-500'}`} />
            </button>

            {showSiteMenu && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setShowSiteMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-xs font-bold text-slate-500 px-2.5 py-1 uppercase tracking-wider flex items-center justify-between">
                    <span>Switch Target Website</span>
                    <span className="text-[11px] text-slate-400 font-mono">{websites.length} total</span>
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
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100 bg-white'
                        }`}
                      >
                        <div className="truncate mr-2 min-w-0">
                          <div className="font-medium truncate">{site.name}</div>
                          <div className={`text-[10px] truncate font-mono ${activeWebsite?.id === site.id ? 'text-blue-100' : 'text-slate-500'}`}>
                            {site.domain} • <span className="uppercase">{site.targetCountry || 'US'}</span> ({site.targetDevice || 'desktop'})
                          </div>
                        </div>
                        {activeWebsite?.id === site.id && (
                          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 pt-2 px-1">
                    <button
                      onClick={() => {
                        onNavigateToTab('websites');
                        setShowSiteMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-semibold transition-colors flex items-center gap-1.5"
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
