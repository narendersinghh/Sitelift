import React from 'react';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  KeyRound,
  Sparkles,
  Activity as ActivityIcon,
  FileText,
  Radio,
  Globe,
  Layers,
  Clock,
  FolderCode,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X
} from 'lucide-react';
import { Website, NavTab } from '../types';
import { storage } from '../services/storage';
import { computeDecliningPages } from '../services/decliningPagesEngine';
import { computeOptimizationPipeline } from '../services/optimizationPipelineEngine';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  websites: Website[];
  activeWebsite: Website | undefined;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  websites,
  activeWebsite,
  onLogout,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse
}) => {
  const authUser = storage.getAuthUser();

  // Dynamic counts for badges
  const currentSiteId = activeWebsite?.id || (websites[0]?.id ?? '');
  const keywords = storage.getKeywords(currentSiteId);
  const insights = storage.getInsights(currentSiteId);
  const activities = storage.getActivities(currentSiteId);
  const gaConn = storage.getGaConnections()[currentSiteId];
  const gscConn = storage.getGscConnections()[currentSiteId];

  // Critical declining count
  const { summary: declineSummary } = computeDecliningPages(currentSiteId, { period: '28d' });
  const criticalDecliningCount = declineSummary?.criticalCount ?? 0;
  const activeKeywordsCount = keywords.filter(k => k.status === 'active').length;
  const pendingActivitiesCount = activities.filter(a => a.status === 'suggested' || a.status === 'approved' || a.status === 'in_progress').length;
  const highImpactInsightsCount = insights.filter(i => i.severity === 'high' || i.severity === 'critical').length;
  const isConnectionsOk = gaConn?.status === 'connected' && gscConn?.status === 'connected';

  // Optimization pipeline count
  const { summary: pipelineSummary } = computeOptimizationPipeline(currentSiteId);
  const pipelineTotalUrls = pipelineSummary?.totalUrls ?? 0;
  const pipelineWinsCount = pipelineSummary?.positiveWinsCount ?? 0;

  interface NavItem {
    id: NavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
    dot?: boolean;
    dotColor?: string;
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  const navGroups: NavGroup[] = [
    {
      title: 'SEO Intelligence',
      items: [
        {
          id: 'dashboard',
          label: 'Overview',
          icon: BarChart3
        },
        {
          id: 'all_pages',
          label: 'All Pages',
          icon: FileText
        },
        {
          id: 'declining_pages',
          label: 'Declining Pages',
          icon: TrendingDown,
          badge: criticalDecliningCount > 0 ? `${criticalDecliningCount} crit` : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
        },
        {
          id: 'optimization_pipeline',
          label: 'Opt. Pipeline',
          icon: TrendingUp,
          badge: pipelineWinsCount > 0 ? `${pipelineWinsCount} wins` : pipelineTotalUrls > 0 ? `${pipelineTotalUrls}` : undefined,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        },
        {
          id: 'keywords',
          label: 'Keyword Tracking',
          icon: KeyRound,
          badge: activeKeywordsCount > 0 ? activeKeywordsCount : undefined,
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
        },
        {
          id: 'insights',
          label: 'Diagnostic Insights',
          icon: Sparkles,
          badge: highImpactInsightsCount > 0 ? `${highImpactInsightsCount} new` : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
        }
      ]
    },
    {
      title: 'Execution & Strategy',
      items: [
        {
          id: 'activities',
          label: 'Activity Planner',
          icon: ActivityIcon,
          badge: pendingActivitiesCount > 0 ? pendingActivitiesCount : undefined,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        },
        {
          id: 'reports',
          label: 'Monthly Reports',
          icon: FileText
        },
        {
          id: 'connections',
          label: 'API Connections',
          icon: Radio,
          dot: true,
          dotColor: isConnectionsOk ? 'bg-emerald-400' : 'bg-amber-400'
        }
      ]
    },
    {
      title: 'System & Tools',
      items: [
        {
          id: 'websites',
          label: 'All Websites',
          icon: Globe,
          badge: websites.length,
          badgeColor: 'bg-white/10 text-slate-300 border border-white/10'
        },
        {
          id: 'category_rules',
          label: 'Category Rules',
          icon: Layers
        },
        {
          id: 'sync_logs',
          label: 'Sync & Cron Logs',
          icon: Clock
        },
        {
          id: 'deployment',
          label: 'Deploy & Installer',
          icon: FolderCode,
          badge: 'PHP 8.2+',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings
        }
      ]
    }
  ];

  const handleItemClick = (id: NavTab) => {
    onSelectTab(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between text-slate-200 select-none overflow-hidden">
      
      {/* Top Header / Brand */}
      <div className="shrink-0 p-4 border-b border-white/10 flex items-center justify-between">
        <div
          onClick={() => handleItemClick('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform shrink-0">
            S
          </div>
          {!isCollapsed && (
            <div className="leading-tight overflow-hidden">
              <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                <span>Sitelift</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v1.0
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">Self-Hosted SEO Suite</div>
            </div>
          )}
        </div>

        {/* Mobile close button / Desktop collapse toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
          
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Nav Groups Menu - Independent Scrollbar */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 custom-scrollbar">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {group.title}
              </div>
            )}

            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />

                    {!isCollapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}

                    {!isCollapsed && item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono tracking-tight shrink-0 ${
                          item.badgeColor || 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {!isCollapsed && item.dot && (
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          item.dotColor || 'bg-emerald-400'
                        }`}
                      />
                    )}

                    {/* Collapsed Tooltip / Dot */}
                    {isCollapsed && (item.badge || item.dot) && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="shrink-0 p-3 border-t border-white/10 bg-slate-950/40 space-y-2">
        {/* User Card & Logout */}
        <div className={`flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-2 backdrop-blur-md ${
          isCollapsed ? 'justify-center p-1.5' : ''
        }`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
                {authUser?.name ? authUser.name.charAt(0) : 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate leading-tight">
                  {authUser?.name || 'Administrator'}
                </div>
                <div className="text-[10px] text-indigo-400 font-medium truncate leading-tight">
                  Self-Hosted PHP 8.2+
                </div>
              </div>
            </div>
          ) : null}

          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-150"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Slide-Over Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0f172a]/95 border-r border-white/10 backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sticky Sidebar (Locked full height, scrollable internally) */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-full bg-[#0f172a] border-r border-white/10 z-30 transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
