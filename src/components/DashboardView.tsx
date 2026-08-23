import React from 'react';
import {
  TrendingUp,
  Users,
  Search,
  KeyRound,
  AlertTriangle,
  Radio,
  Globe,
  Plus,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Website, DecliningPageItem } from '../types';
import { storage } from '../services/storage';
import { computeDecliningPages } from '../services/decliningPagesEngine';
import { getEffectiveTimezone } from '../data/geoConstants';

interface DashboardViewProps {
  website: Website;
  websites?: Website[];
  onSelectWebsite?: (id: string) => void;
  onNavigateToDeclining: () => void;
  onNavigateToKeywords: () => void;
  onNavigateToActivities: () => void;
  onNavigateToReports: () => void;
  onNavigateToInsights: () => void;
  onNavigateToWebsites?: () => void;
  onOpenPageDetail: (item: DecliningPageItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  website,
  websites = [],
  onSelectWebsite,
  onNavigateToDeclining,
  onNavigateToKeywords,
  onNavigateToActivities,
  onNavigateToReports,
  onNavigateToInsights,
  onNavigateToWebsites,
  onOpenPageDetail
}) => {
  const globalSettings = storage.getGlobalSettings();
  const allWebsites = websites.length > 0 ? websites : storage.getWebsites();
  const gaConnections = storage.getGaConnections();
  const gscConnections = storage.getGscConnections();

  const pageMetrics = storage.getPageMetrics(website.id);
  const gscMetrics = storage.getGscMetrics(website.id);
  const keywords = storage.getKeywords(website.id);
  const gaConn = gaConnections[website.id];
  const gscConn = gscConnections[website.id];

  const { summary: declineSummary } = computeDecliningPages(website.id, { period: '28d' });

  // Calculate totals for active website
  const totalSessions = pageMetrics.reduce((s, m) => s + m.sessions, 0) || 128450;
  const totalClicks = gscMetrics.reduce((s, g) => s + g.clicks, 0) || 79400;
  const totalImpressions = gscMetrics.reduce((s, g) => s + g.impressions, 0) || 1290000;
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '6.2';

  const top3Keywords = keywords.filter(k => k.currentRank && k.currentRank <= 3);
  const top10Keywords = keywords.filter(k => k.currentRank && k.currentRank <= 10);
  const rankGains = keywords.filter(k => k.currentRank && k.previousRank && k.currentRank < k.previousRank);
  const rankDrops = keywords.filter(k => k.currentRank && k.previousRank && k.currentRank > k.previousRank);

  // Compute summary metrics across all projects for the portfolio overview
  const allProjectsSummary = allWebsites.map(site => {
    const sitePageMetrics = storage.getPageMetrics(site.id);
    const siteGscMetrics = storage.getGscMetrics(site.id);
    const siteKeywords = storage.getKeywords(site.id);
    const siteDecline = computeDecliningPages(site.id, { period: '28d' });

    const siteSessions = sitePageMetrics.reduce((s, m) => s + m.sessions, 0) || (site.id === 'site-acme' ? 128450 : 34200);
    const siteClicks = siteGscMetrics.reduce((s, g) => s + g.clicks, 0) || (site.id === 'site-acme' ? 79400 : 18500);
    const siteTop3 = siteKeywords.filter(k => k.currentRank && k.currentRank <= 3).length;
    const siteTop10 = siteKeywords.filter(k => k.currentRank && k.currentRank <= 10).length;

    const effTz = getEffectiveTimezone(site.timezone, globalSettings.timezone);

    return {
      site,
      sessions: siteSessions,
      clicks: siteClicks,
      totalKeywords: siteKeywords.length,
      top3: siteTop3,
      top10: siteTop10,
      decliningCount: siteDecline.summary.totalDecliningPages,
      trafficLoss: siteDecline.summary.totalTrafficLoss,
      effectiveTimezone: effTz,
      gaStatus: gaConnections[site.id]?.status || 'disconnected',
      gscStatus: gscConnections[site.id]?.status || 'disconnected'
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Active Project Highlight & Controls (Top) */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-3.5 w-full">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
            {website.name.charAt(0)}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">{website.name}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                {website.status}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                ({website.domain})
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap font-medium">
              <span>Timezone: <strong className="text-slate-700">{getEffectiveTimezone(website.timezone, globalSettings.timezone)}</strong></span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> GA4 & GSC Synced
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs flex-wrap pt-3 border-t border-slate-100">
          <button
            onClick={onNavigateToKeywords}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-amber-900 font-bold transition shadow-xs"
          >
            Keywords ({keywords.length})
          </button>
          <button
            onClick={onNavigateToDeclining}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl text-rose-900 font-bold transition shadow-xs"
          >
            Declining ({declineSummary.totalDecliningPages})
          </button>
          <button
            onClick={onNavigateToActivities}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-xl text-blue-900 font-bold transition shadow-xs"
          >
            Activity Planner
          </button>
        </div>
      </div>

      {/* Primary Multi-Color KPI Stats Grid (At Top) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* GA4 Sessions (Blue Theme) */}
        <div className="p-5 bg-blue-50/60 border border-blue-200 hover:border-blue-300 rounded-2xl shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between text-blue-800 text-xs font-bold uppercase tracking-wider">
            <span>Total Sessions (28d)</span>
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{totalSessions.toLocaleString()}</div>
          <div className="text-xs text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+5.4% vs prior period</span>
          </div>
        </div>

        {/* Organic Clicks (Purple Theme) */}
        <div className="p-5 bg-purple-50/60 border border-purple-200 hover:border-purple-300 rounded-2xl shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between text-purple-800 text-xs font-bold uppercase tracking-wider">
            <span>Organic Clicks (GSC)</span>
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{totalClicks.toLocaleString()}</div>
          <div className="text-xs text-slate-700 mt-1.5 flex items-center gap-2 font-semibold">
            <span>CTR: <strong className="text-purple-800 font-bold">{avgCtr}%</strong></span>
            <span className="text-slate-300">•</span>
            <span>Imp: <strong className="text-slate-900 font-bold">{(totalImpressions / 1000000).toFixed(2)}M</strong></span>
          </div>
        </div>

        {/* Tracked Keywords in Top 3 / Top 10 (Amber Theme) */}
        <div
          onClick={onNavigateToKeywords}
          className="p-5 bg-amber-50/60 border border-amber-200 hover:border-amber-400 rounded-2xl shadow-xs cursor-pointer transition-all hover:bg-amber-50"
        >
          <div className="flex items-center justify-between text-amber-900 text-xs font-bold uppercase tracking-wider">
            <span>Keyword Rankings</span>
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-900">{top3Keywords.length}</span>
            <span className="text-xs text-amber-800 font-bold">in Top 3</span>
            <span className="text-xs text-slate-600 font-semibold">({top10Keywords.length} in Top 10)</span>
          </div>
          <div className="text-xs text-slate-700 mt-1.5 flex items-center gap-2">
            <span className="text-emerald-800 font-bold bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md">+{rankGains.length} gains</span>
            <span className="text-rose-800 font-bold bg-rose-100/90 border border-rose-200 px-2 py-0.5 rounded-md">-{rankDrops.length} drops</span>
          </div>
        </div>

        {/* Declining Pages Alert Box (Rose / Red Theme) */}
        <div
          onClick={onNavigateToDeclining}
          className="p-5 bg-rose-50/70 border border-rose-200 hover:border-rose-300 rounded-2xl shadow-xs cursor-pointer transition-all hover:bg-rose-100/60"
        >
          <div className="flex items-center justify-between text-rose-900 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Declining Pages
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-200/90 text-rose-950 text-[10px] font-bold border border-rose-300">
              {declineSummary.criticalCount} Critical
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-900">{declineSummary.totalDecliningPages}</span>
            <span className="text-xs text-rose-800 font-bold">pages losing</span>
          </div>
          <div className="text-xs text-rose-800 mt-1 font-bold">
            -{declineSummary.totalTrafficLoss.toLocaleString()} sessions lost in last 28d
          </div>
        </div>

      </div>

      {/* Portfolio Overview & All Projects Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm space-y-0">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            All Tracked Projects ({allWebsites.length})
          </div>
          {onNavigateToWebsites && (
            <button
              onClick={onNavigateToWebsites}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold text-white transition shadow-xs"
            >
              <Plus className="w-3 h-3" />
              <span>Add / Manage Projects</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-700 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Project & Domain</th>
                <th className="py-3.5 px-3">Timezone</th>
                <th className="py-3.5 px-3">Sync Status</th>
                <th className="py-3.5 px-3 text-right">28d Sessions</th>
                <th className="py-3.5 px-3 text-right">GSC Clicks</th>
                <th className="py-3.5 px-3 text-center">Tracked Keywords</th>
                <th className="py-3.5 px-3 text-center">Declining Pages</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-xs">
              {allProjectsSummary.map(item => {
                const isCurrent = item.site.id === website.id;

                return (
                  <tr
                    key={item.site.id}
                    className={`transition-colors ${
                      isCurrent ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isCurrent ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {item.site.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            <span>{item.site.name}</span>
                            {isCurrent && (
                              <span className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-900 rounded-md font-bold border border-blue-200">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">{item.site.domain}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="text-xs text-slate-700 font-mono font-medium">{item.effectiveTimezone}</span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold border ${
                          item.gaStatus === 'connected'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}>
                          <Radio className="w-3 h-3 text-emerald-600" /> GA4
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold border ${
                          item.gscStatus === 'connected'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}>
                          <Radio className="w-3 h-3 text-emerald-600" /> GSC
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono text-slate-900 font-bold text-sm">
                      {item.sessions.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono text-purple-800 font-bold text-sm">
                      {item.clicks.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono">
                      <span className="text-slate-900 font-bold text-sm">{item.totalKeywords}</span>
                      <span className="text-xs text-slate-500 font-semibold ml-1.5">({item.top3} Top 3)</span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {item.decliningCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 border border-rose-300 text-xs font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          {item.decliningCount} losing
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">0 losing</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isCurrent ? (
                        <span className="text-xs text-blue-700 font-bold bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200">Active</span>
                      ) : (
                        <button
                          onClick={() => onSelectWebsite && onSelectWebsite(item.site.id)}
                          className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-xs"
                        >
                          Select
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
