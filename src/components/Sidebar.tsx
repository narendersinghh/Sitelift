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

  // Version state for deployment update alerts
  const versionState = storage.getVersionState();
  const hasUpdate = Boolean(versionState.latestAvailableRelease);
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
    iconColor: string;
    iconBg: string;
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
          icon: BarChart3,
          iconColor: 'text-blue-400',
          iconBg: 'bg-blue-500/10 group-hover:bg-blue-500/20'
        },
        {
          id: 'all_pages',
          label: 'All Pages',
          icon: FileText,
          iconColor: 'text-emerald-400',
          iconBg: 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
        },
        {
          id: 'declining_pages',
          label: 'Declining Pages',
          icon: TrendingDown,
          iconColor: 'text-rose-400',
          iconBg: 'bg-rose-500/10 group-hover:bg-rose-500/20',
          badge: criticalDecliningCount > 0 ? `${criticalDecliningCount} crit` : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
        },
        {
          id: 'optimization_pipeline',
          label: 'Opt. Pipeline',
          icon: TrendingUp,
          iconColor: 'text-purple-400',
          iconBg: 'bg-purple-500/10 group-hover:bg-purple-500/20',
          badge: pipelineWinsCount > 0 ? `${pipelineWinsCount} wins` : pipelineTotalUrls > 0 ? `${pipelineTotalUrls}` : undefined,
          badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
        },
        {
          id: 'keywords',
          label: 'Keyword Tracking',
          icon: KeyRound,
          iconColor: 'text-amber-400',
          iconBg: 'bg-amber-500/10 group-hover:bg-amber-500/20',
          badge: activeKeywordsCount > 0 ? activeKeywordsCount : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
        },
        {
          id: 'insights',
          label: 'Diagnostic Insights',
          icon: Sparkles,
          iconColor: 'text-pink-400',
          iconBg: 'bg-pink-500/10 group-hover:bg-pink-500/20',
          badge: highImpactInsightsCount > 0 ? `${highImpactInsightsCount} new` : undefined,
          badgeColor: 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
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
          iconColor: 'text-emerald-400',
          iconBg: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
          badge: pendingActivitiesCount > 0 ? pendingActivitiesCount : undefined,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        },
        {
          id: 'reports',
          label: 'Monthly Reports',
          icon: FileText,
          iconColor: 'text-sky-400',
          iconBg: 'bg-sky-500/10 group-hover:bg-sky-500/20'
        },
        {
          id: 'connections',
          label: 'API Connections',
          icon: Radio,
          iconColor: 'text-cyan-400',
          iconBg: 'bg-cyan-500/10 group-hover:bg-cyan-500/20',
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
          iconColor: 'text-violet-400',
          iconBg: 'bg-violet-500/10 group-hover:bg-violet-500/20',
          badge: websites.length,
          badgeColor: 'bg-white/10 text-slate-300 border border-white/10'
        },
        {
          id: 'category_rules',
          label: 'Category & Classification',
          icon: Layers,
          iconColor: 'text-indigo-400',
          iconBg: 'bg-indigo-500/10 group-hover:bg-indigo-500/20'
        },
        {
          id: 'sync_logs',
          label: 'Sync & Cron Logs',
          icon: Clock,
          iconColor: 'text-orange-400',
          iconBg: 'bg-orange-500/10 group-hover:bg-orange-500/20'
        },
        {
          id: 'deployment',
          label: 'Deploy & Updates',
          icon: FolderCode,
          iconColor: 'text-blue-400',
          iconBg: 'bg-blue-500/10 group-hover:bg-blue-500/20',
          dot: hasUpdate,
          dotColor: 'bg-emerald-400',
          badge: !hasUpdate ? versionState.currentVersion : undefined,
          badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          iconColor: 'text-slate-400',
          iconBg: 'bg-white/5 group-hover:bg-white/10'
        }
      ]
    }
  ];

  const handleItemClick = (id: NavTab) => {
    onSelectTab(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between text-slate-200 select-none overflow-hidden bg-[#0c1322]">
      
      {/* Top Header / Brand */}
      <div className="shrink-0 p-4 border-b border-slate-800 flex items-center justify-between">
        <div
          onClick={() => handleItemClick('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform shrink-0">
            S
          </div>
          {!isCollapsed && (
            <div className="leading-tight overflow-hidden">
              <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                <span>Sitelift</span>
                <span className="text-[11px] px-1.5 py-0.2 rounded-full font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {versionState.currentVersion}
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate">Your personal SEO Suite</div>
            </div>
          )}
        </div>

        {/* Mobile close button / Desktop collapse toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
          
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Nav Groups Menu - Dark Scrollbar */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 dark-sidebar-scrollbar">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            {!isCollapsed && (
              <div className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {group.title}
              </div>
            )}

            <div className="space-y-1">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all group relative ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : `${item.iconBg} ${item.iconColor}`
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {!isCollapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}

                    {!isCollapsed && item.badge !== undefined && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold font-mono tracking-tight shrink-0 ${
                          item.badgeColor || 'bg-slate-800 text-slate-300'
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
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="shrink-0 p-3 border-t border-slate-800 bg-[#080d18] space-y-2">
        {/* User Card & Logout */}
        <div className={`flex items-center justify-between rounded-xl bg-slate-900 border border-slate-800 p-2.5 ${
          isCollapsed ? 'justify-center p-1.5' : ''
        }`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                {authUser?.name ? authUser.name.charAt(0) : 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-200 truncate leading-tight">
                  {authUser?.name?.replace(/Primary /i, '') || 'Administrator'}
                </div>
                <div className="text-xs text-slate-400 font-medium truncate leading-tight">
                  Active Session
                </div>
              </div>
            </div>
          ) : null}

          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0c1322] border-r border-slate-800 transition-transform duration-300 ease-in-out lg:hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sticky Sidebar (Locked full height, scrollable internally - 10px wider: w-[276px]) */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 bg-[#0c1322] border-r border-slate-800 z-30 transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? 'w-20' : 'w-[276px]'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
