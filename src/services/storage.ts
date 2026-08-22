import {
  Website,
  GaConnection,
  GscConnection,
  PageMetricDaily,
  GscQueryMetricDaily,
  Keyword,
  KeywordRankSnapshot,
  CategoryRule,
  Insight,
  Activity,
  MonthlyReport,
  GlobalSettings,
  SyncJob,
  InstallerState,
  SubmittedPageItem,
  PageIndexStatus
} from '../types';

import {
  initialWebsites,
  initialGaConnections,
  initialGscConnections,
  initialCategoryRules,
  initialKeywords,
  initialRankSnapshots,
  generateMockPageMetrics,
  generateMockGscMetrics,
  initialInsights,
  initialActivities,
  initialMonthlyReports,
  initialGlobalSettings,
  initialSyncJobs,
  initialInstallerState
} from '../data/mockData';

const STORAGE_KEYS = {
  WEBSITES: 'sitelift_websites',
  GA_CONNECTIONS: 'sitelift_ga_connections',
  GSC_CONNECTIONS: 'sitelift_gsc_connections',
  CATEGORY_RULES: 'sitelift_category_rules',
  KEYWORDS: 'sitelift_keywords',
  RANK_SNAPSHOTS: 'sitelift_rank_snapshots',
  PAGE_METRICS: 'sitelift_page_metrics',
  GSC_METRICS: 'sitelift_gsc_metrics',
  INSIGHTS: 'sitelift_insights',
  ACTIVITIES: 'sitelift_activities',
  MONTHLY_REPORTS: 'sitelift_monthly_reports',
  GLOBAL_SETTINGS: 'sitelift_global_settings',
  SYNC_JOBS: 'sitelift_sync_jobs',
  INSTALLER_STATE: 'sitelift_installer_state',
  ACTIVE_WEBSITE_ID: 'sitelift_active_website_id',
  AUTH_USER: 'sitelift_auth_user'
};

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  loggedInAt?: string;
  csrfToken?: string;
  createdAt?: string;
}

class StorageService {
  private get<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // Initialize defaults if empty
  public init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.WEBSITES)) {
      this.resetToDefaults();
    } else {
      this.autoSyncGa4GscDailyAtMidnight();
    }
  }

  public resetToDefaults(): void {
    this.set(STORAGE_KEYS.WEBSITES, initialWebsites);
    this.set(STORAGE_KEYS.GA_CONNECTIONS, initialGaConnections);
    this.set(STORAGE_KEYS.GSC_CONNECTIONS, initialGscConnections);
    this.set(STORAGE_KEYS.CATEGORY_RULES, initialCategoryRules);
    this.set(STORAGE_KEYS.KEYWORDS, initialKeywords);
    this.set(STORAGE_KEYS.RANK_SNAPSHOTS, initialRankSnapshots);
    this.set(STORAGE_KEYS.PAGE_METRICS, generateMockPageMetrics());
    this.set(STORAGE_KEYS.GSC_METRICS, generateMockGscMetrics());
    this.set(STORAGE_KEYS.INSIGHTS, initialInsights);
    this.set(STORAGE_KEYS.ACTIVITIES, initialActivities);
    this.set(STORAGE_KEYS.MONTHLY_REPORTS, initialMonthlyReports);
    this.set(STORAGE_KEYS.GLOBAL_SETTINGS, initialGlobalSettings);
    this.set(STORAGE_KEYS.SYNC_JOBS, initialSyncJobs);
    this.set(STORAGE_KEYS.INSTALLER_STATE, initialInstallerState);
    this.set(STORAGE_KEYS.ACTIVE_WEBSITE_ID, 'site-acme');
    this.set(STORAGE_KEYS.AUTH_USER, {
      id: 'usr-1',
      email: 'admin@sitelift.local',
      name: 'Primary Administrator',
      role: 'admin',
      loggedInAt: new Date().toISOString(),
      csrfToken: 'csrf_' + Math.random().toString(36).substring(2, 15)
    });
  }

  // Auth User
  public getAuthUser(): AuthUser | null {
    return this.get<AuthUser | null>(STORAGE_KEYS.AUTH_USER, {
      id: 'usr-1',
      email: 'admin@sitelift.local',
      name: 'Primary Administrator',
      role: 'admin',
      loggedInAt: new Date().toISOString(),
      csrfToken: 'csrf_demo_token_123'
    });
  }

  public setAuthUser(user: AuthUser | null): void {
    this.set(STORAGE_KEYS.AUTH_USER, user);
  }

  // Active Website
  public getActiveWebsiteId(): string {
    return this.get<string>(STORAGE_KEYS.ACTIVE_WEBSITE_ID, 'site-acme');
  }

  public setActiveWebsiteId(id: string): void {
    this.set(STORAGE_KEYS.ACTIVE_WEBSITE_ID, id);
  }

  public getActiveWebsite(): Website | undefined {
    const websites = this.getWebsites();
    const activeId = this.getActiveWebsiteId();
    return websites.find(w => w.id === activeId) || websites[0];
  }

  // Websites
  public getWebsites(): Website[] {
    return this.get<Website[]>(STORAGE_KEYS.WEBSITES, initialWebsites);
  }

  public saveWebsite(site: Website): void {
    const list = this.getWebsites();
    const index = list.findIndex(w => w.id === site.id);
    if (index >= 0) {
      list[index] = site;
    } else {
      list.push(site);
    }
    this.set(STORAGE_KEYS.WEBSITES, list);
  }

  public deleteWebsite(siteId: string, permanent: boolean = false): void {
    let list = this.getWebsites();
    if (permanent) {
      list = list.filter(w => w.id !== siteId);
    } else {
      list = list.map(w => (w.id === siteId ? { ...w, status: 'deleted' as const } : w));
    }
    this.set(STORAGE_KEYS.WEBSITES, list);
  }

  // GA Connections
  public getGaConnections(): Record<string, GaConnection> {
    return this.get<Record<string, GaConnection>>(STORAGE_KEYS.GA_CONNECTIONS, initialGaConnections);
  }

  public saveGaConnection(conn: GaConnection): void {
    const all = this.getGaConnections();
    all[conn.websiteId] = conn;
    this.set(STORAGE_KEYS.GA_CONNECTIONS, all);
  }

  // GSC Connections
  public getGscConnections(): Record<string, GscConnection> {
    return this.get<Record<string, GscConnection>>(STORAGE_KEYS.GSC_CONNECTIONS, initialGscConnections);
  }

  public saveGscConnection(conn: GscConnection): void {
    const all = this.getGscConnections();
    all[conn.websiteId] = conn;
    this.set(STORAGE_KEYS.GSC_CONNECTIONS, all);
  }

  // Category Rules
  public getCategoryRules(websiteId?: string): CategoryRule[] {
    const rules = this.get<CategoryRule[]>(STORAGE_KEYS.CATEGORY_RULES, initialCategoryRules);
    if (websiteId) {
      return rules.filter(r => r.websiteId === websiteId);
    }
    return rules;
  }

  public saveCategoryRule(rule: CategoryRule): void {
    const list = this.get<CategoryRule[]>(STORAGE_KEYS.CATEGORY_RULES, initialCategoryRules);
    const idx = list.findIndex(r => r.id === rule.id);
    if (idx >= 0) {
      list[idx] = rule;
    } else {
      list.push(rule);
    }
    this.set(STORAGE_KEYS.CATEGORY_RULES, list);
  }

  public deleteCategoryRule(ruleId: string): void {
    const list = this.get<CategoryRule[]>(STORAGE_KEYS.CATEGORY_RULES, initialCategoryRules);
    this.set(STORAGE_KEYS.CATEGORY_RULES, list.filter(r => r.id !== ruleId));
  }

  // Keywords
  public getKeywords(websiteId?: string): Keyword[] {
    const keywords = this.get<Keyword[]>(STORAGE_KEYS.KEYWORDS, initialKeywords);
    if (websiteId) {
      return keywords.filter(k => k.websiteId === websiteId);
    }
    return keywords;
  }

  public saveKeyword(keyword: Keyword): void {
    const list = this.get<Keyword[]>(STORAGE_KEYS.KEYWORDS, initialKeywords);
    const idx = list.findIndex(k => k.id === keyword.id);
    if (idx >= 0) {
      list[idx] = keyword;
    } else {
      list.push(keyword);
    }
    this.set(STORAGE_KEYS.KEYWORDS, list);
  }

  public deleteKeyword(id: string): void {
    const list = this.get<Keyword[]>(STORAGE_KEYS.KEYWORDS, initialKeywords);
    this.set(STORAGE_KEYS.KEYWORDS, list.filter(k => k.id !== id));
  }

  // Rank Snapshots
  public getRankSnapshots(websiteId?: string): KeywordRankSnapshot[] {
    const snapshots = this.get<KeywordRankSnapshot[]>(STORAGE_KEYS.RANK_SNAPSHOTS, initialRankSnapshots);
    if (websiteId) {
      return snapshots.filter(s => s.websiteId === websiteId);
    }
    return snapshots;
  }

  public getKeywordRankSnapshots(websiteId: string, keywordId: string): KeywordRankSnapshot[] {
    const snapshots = this.get<KeywordRankSnapshot[]>(STORAGE_KEYS.RANK_SNAPSHOTS, initialRankSnapshots);
    return snapshots
      .filter(s => s.websiteId === websiteId && s.keywordId === keywordId)
      .sort((a, b) => (b.snapshotDate || '').localeCompare(a.snapshotDate || ''));
  }

  public saveRankSnapshot(snapshot: KeywordRankSnapshot): void {
    const list = this.get<KeywordRankSnapshot[]>(STORAGE_KEYS.RANK_SNAPSHOTS, initialRankSnapshots);
    list.push(snapshot);
    this.set(STORAGE_KEYS.RANK_SNAPSHOTS, list);
  }

  // Page Metrics Daily
  public getPageMetrics(websiteId?: string): PageMetricDaily[] {
    const metrics = this.get<PageMetricDaily[]>(STORAGE_KEYS.PAGE_METRICS, []);
    if (websiteId) {
      return metrics.filter(m => m.websiteId === websiteId);
    }
    return metrics;
  }

  // GSC Metrics Daily
  public getGscMetrics(websiteId?: string): GscQueryMetricDaily[] {
    const metrics = this.get<GscQueryMetricDaily[]>(STORAGE_KEYS.GSC_METRICS, []);
    if (websiteId) {
      return metrics.filter(m => m.websiteId === websiteId);
    }
    return metrics;
  }

  // All Submitted Pages from GSC / Sitemap & Performance Engine
  public getSubmittedPages(websiteId: string): SubmittedPageItem[] {
    const pageMetrics = this.getPageMetrics(websiteId);
    const gscMetrics = this.getGscMetrics(websiteId);
    const website = this.getWebsites().find(w => w.id === websiteId) || this.getWebsites()[0];
    const domain = website?.domain || 'acmesoftware.io';

    // Group known URLs
    const urlMap: Record<
      string,
      {
        pageUrl: string;
        cleanPath: string;
        category: string;
        sessions: number;
        clicks: number;
        impressions: number;
        positions: number[];
        queries: Record<string, { query: string; clicks: number; impressions: number; ctr: number; position: number; isBranded: boolean }>;
      }
    > = {};

    pageMetrics.forEach(m => {
      const url = m.fullUrl || `https://${domain}${m.pagePath}`;
      if (!urlMap[url]) {
        urlMap[url] = {
          pageUrl: url,
          cleanPath: m.cleanPath || m.pagePath,
          category: m.category || 'General',
          sessions: 0,
          clicks: 0,
          impressions: 0,
          positions: [],
          queries: {}
        };
      }
      urlMap[url].sessions += m.sessions;
    });

    gscMetrics.forEach(g => {
      const url = g.pageUrl || `https://${domain}${g.cleanPath}`;
      if (!urlMap[url]) {
        urlMap[url] = {
          pageUrl: url,
          cleanPath: g.cleanPath,
          category: g.category || 'General',
          sessions: 0,
          clicks: 0,
          impressions: 0,
          positions: [],
          queries: {}
        };
      }
      urlMap[url].clicks += g.clicks;
      urlMap[url].impressions += g.impressions;
      if (g.position > 0) urlMap[url].positions.push(g.position);

      if (!urlMap[url].queries[g.query]) {
        urlMap[url].queries[g.query] = {
          query: g.query,
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: g.position,
          isBranded: g.isBranded
        };
      }
      urlMap[url].queries[g.query].clicks += g.clicks;
      urlMap[url].queries[g.query].impressions += g.impressions;
    });

    // Also include catalog of submitted URLs in XML sitemap that may have 0 impressions or be excluded/not indexed
    const additionalSitemapUrls = [
      {
        path: '/docs/api-v2-authentication-reference',
        category: 'Docs',
        indexStatus: 'indexed' as PageIndexStatus,
        statusLabel: 'Indexed',
        sessions: 0,
        clicks: 0,
        impressions: 120,
        pos: 34.2,
        mobile: 'good' as const,
        cwv: 'good' as const
      },
      {
        path: '/changelog/release-2026-06-patch-4',
        category: 'Changelog',
        indexStatus: 'indexed' as PageIndexStatus,
        statusLabel: 'Indexed',
        sessions: 0,
        clicks: 0,
        impressions: 0,
        pos: 0,
        mobile: 'good' as const,
        cwv: 'good' as const
      },
      {
        path: '/drafts/q3-customer-interview-draft',
        category: 'Blog',
        indexStatus: 'excluded_noindex' as PageIndexStatus,
        statusLabel: 'Excluded by "noindex" tag',
        sessions: 0,
        clicks: 0,
        impressions: 0,
        pos: 0,
        mobile: 'good' as const,
        cwv: 'good' as const,
        note: 'Contains <meta name="robots" content="noindex">. Remove tag if this draft is meant to be indexed.'
      },
      {
        path: '/landing/temp-partner-deal-2025',
        indexStatus: 'discovered_not_indexed' as PageIndexStatus,
        category: 'Landing Pages',
        statusLabel: 'Discovered – currently not indexed',
        sessions: 0,
        clicks: 0,
        impressions: 0,
        pos: 0,
        mobile: 'needs_improvement' as const,
        cwv: 'needs_improvement' as const,
        note: 'Googlebot discovered URL in sitemap but has not allocated crawl budget yet. Boost internal linking.'
      },
      {
        path: '/features/legacy-export-tool-deprecated',
        indexStatus: 'crawled_not_indexed' as PageIndexStatus,
        category: 'Features',
        statusLabel: 'Crawled – currently not indexed',
        sessions: 0,
        clicks: 0,
        impressions: 0,
        pos: 0,
        mobile: 'good' as const,
        cwv: 'good' as const,
        note: 'Crawled by Googlebot but quality algorithm chose not to index. Needs content refresh or 301 redirect.'
      },
      {
        path: '/old-press/announcing-seed-funding-2023',
        indexStatus: 'not_found_404' as PageIndexStatus,
        category: 'General',
        statusLabel: 'Not found (404 Error)',
        sessions: 0,
        clicks: 0,
        impressions: 0,
        pos: 0,
        mobile: 'poor' as const,
        cwv: 'poor' as const,
        note: 'Returns HTTP 404. Setup 301 redirect to /about or update sitemap XML.'
      },
      {
        path: '/blog/productivity-tips-duplicate-print-version',
        indexStatus: 'duplicate_no_canonical' as PageIndexStatus,
        category: 'Blog',
        statusLabel: 'Duplicate without user-selected canonical',
        sessions: 0,
        clicks: 0,
        impressions: 0,
        pos: 0,
        mobile: 'good' as const,
        cwv: 'good' as const,
        note: 'Duplicate content detected. Add rel="canonical" href targeting main article.'
      }
    ];

    additionalSitemapUrls.forEach(extra => {
      const fullUrl = `https://${domain}${extra.path}`;
      if (!urlMap[fullUrl]) {
        urlMap[fullUrl] = {
          pageUrl: fullUrl,
          cleanPath: extra.path,
          category: extra.category,
          sessions: extra.sessions,
          clicks: extra.clicks,
          impressions: extra.impressions,
          positions: extra.pos > 0 ? [extra.pos] : [],
          queries: {}
        };
      }
    });

    const result: SubmittedPageItem[] = Object.values(urlMap).map((entry, idx) => {
      const avgPos = entry.positions.length > 0
        ? Number((entry.positions.reduce((a, b) => a + b, 0) / entry.positions.length).toFixed(1))
        : 0;
      const ctr = entry.impressions > 0 ? Number(((entry.clicks / entry.impressions) * 100).toFixed(2)) : 0;
      
      const extraInfo = additionalSitemapUrls.find(a => entry.cleanPath.includes(a.path));
      let indexStatus: PageIndexStatus = extraInfo ? extraInfo.indexStatus : 'indexed';
      let indexStatusLabel = extraInfo ? extraInfo.statusLabel : 'Indexed';

      if (!extraInfo) {
        if (entry.impressions > 0 || entry.sessions > 0) {
          indexStatus = 'indexed';
          indexStatusLabel = 'Indexed & Live';
        } else {
          indexStatus = 'indexed';
          indexStatusLabel = 'Indexed';
        }
      }

      const isZeroTraffic = entry.sessions === 0 && entry.clicks === 0;
      const isZeroImpressions = entry.impressions === 0;
      const isTopPerformer = entry.clicks > 150 || entry.sessions > 500;

      const topQueriesList = Object.values(entry.queries)
        .map(q => ({
          ...q,
          ctr: q.impressions > 0 ? Number(((q.clicks / q.impressions) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      // Clean Title Generator
      const pathSlug = entry.cleanPath.replace(/^\//, '').replace(/\//g, ' > ').replace(/-/g, ' ');
      const formattedTitle = pathSlug
        ? pathSlug.replace(/\b\w/g, l => l.toUpperCase())
        : 'Homepage • Main Portal';

      return {
        id: `page-sub-${idx}-${entry.cleanPath.replace(/[^a-zA-Z0-9]/g, '-')}`,
        websiteId,
        pageUrl: entry.pageUrl,
        cleanPath: entry.cleanPath,
        title: formattedTitle,
        category: entry.category,
        indexStatus,
        indexStatusLabel,
        lastCrawledAt: new Date(Date.now() - ((idx % 7) + 1) * 86400000).toISOString().slice(0, 10),
        sitemapSubmitted: true,
        totalSessions: entry.sessions,
        totalClicks: entry.clicks,
        totalImpressions: entry.impressions,
        avgPosition: avgPos,
        ctr,
        isZeroTraffic,
        isZeroImpressions,
        isTopPerformer,
        topQueries: topQueriesList,
        mobileUsability: extraInfo?.mobile || 'good',
        coreWebVitals: extraInfo?.cwv || 'good',
        diagnosisNote: extraInfo?.note
      };
    });

    return result.sort((a, b) => b.totalClicks - a.totalClicks);
  }

  // Automatic Midnight Daily Sync for GA4 & GSC (excludes keyword ranking per instructions)
  public autoSyncGa4GscDailyAtMidnight(websiteId?: string): void {
    try {
      const websites = this.getWebsites();
      const targetSites = websiteId ? websites.filter(w => w.id === websiteId) : websites;
      const todayStr = new Date().toISOString().slice(0, 10);
      const gaConnections = this.getGaConnections();
      const gscConnections = this.getGscConnections();

      let hasUpdated = false;
      targetSites.forEach(site => {
        const ga = gaConnections[site.id];
        const gsc = gscConnections[site.id];

        // Check if synced today
        const gaLastDate = ga?.lastSyncedAt ? ga.lastSyncedAt.slice(0, 10) : '';
        const gscLastDate = gsc?.lastSyncedAt ? gsc.lastSyncedAt.slice(0, 10) : '';

        if (gaLastDate !== todayStr) {
          if (ga) {
            gaConnections[site.id] = {
              ...ga,
              lastSyncedAt: new Date().toISOString(),
              lastSyncStatus: 'success',
              status: 'connected'
            };
            hasUpdated = true;
          }
        }

        if (gscLastDate !== todayStr) {
          if (gsc) {
            gscConnections[site.id] = {
              ...gsc,
              lastSyncedAt: new Date().toISOString(),
              lastSyncStatus: 'success',
              status: 'connected'
            };
            hasUpdated = true;
          }
        }
      });

      if (hasUpdated) {
        this.set(STORAGE_KEYS.GA_CONNECTIONS, gaConnections);
        this.set(STORAGE_KEYS.GSC_CONNECTIONS, gscConnections);
      }
    } catch (err) {
      console.warn('Auto midnight sync failed:', err);
    }
  }

  // Insights
  public getInsights(websiteId?: string): Insight[] {
    const list = this.get<Insight[]>(STORAGE_KEYS.INSIGHTS, initialInsights);
    if (websiteId) {
      return list.filter(i => i.websiteId === websiteId);
    }
    return list;
  }

  public saveInsight(insight: Insight): void {
    const list = this.get<Insight[]>(STORAGE_KEYS.INSIGHTS, initialInsights);
    const idx = list.findIndex(i => i.id === insight.id);
    if (idx >= 0) {
      list[idx] = insight;
    } else {
      list.push(insight);
    }
    this.set(STORAGE_KEYS.INSIGHTS, list);
  }

  // Activities
  public getActivities(websiteId?: string): Activity[] {
    const list = this.get<Activity[]>(STORAGE_KEYS.ACTIVITIES, initialActivities);
    if (websiteId) {
      return list.filter(a => a.websiteId === websiteId);
    }
    return list;
  }

  public saveActivity(activity: Activity): void {
    const list = this.get<Activity[]>(STORAGE_KEYS.ACTIVITIES, initialActivities);
    const idx = list.findIndex(a => a.id === activity.id);
    if (idx >= 0) {
      list[idx] = activity;
    } else {
      list.push(activity);
    }
    this.set(STORAGE_KEYS.ACTIVITIES, list);
  }

  public deleteActivity(id: string): void {
    const list = this.get<Activity[]>(STORAGE_KEYS.ACTIVITIES, initialActivities);
    this.set(STORAGE_KEYS.ACTIVITIES, list.filter(a => a.id !== id));
  }

  // Monthly Reports
  public getMonthlyReports(websiteId?: string): MonthlyReport[] {
    const list = this.get<MonthlyReport[]>(STORAGE_KEYS.MONTHLY_REPORTS, initialMonthlyReports);
    if (websiteId) {
      return list.filter(r => r.websiteId === websiteId);
    }
    return list;
  }

  public saveMonthlyReport(report: MonthlyReport): void {
    const list = this.get<MonthlyReport[]>(STORAGE_KEYS.MONTHLY_REPORTS, initialMonthlyReports);
    const idx = list.findIndex(r => r.id === report.id);
    if (idx >= 0) {
      list[idx] = report;
    } else {
      list.unshift(report);
    }
    this.set(STORAGE_KEYS.MONTHLY_REPORTS, list);
  }

  public deleteMonthlyReport(id: string): void {
    const list = this.get<MonthlyReport[]>(STORAGE_KEYS.MONTHLY_REPORTS, initialMonthlyReports);
    this.set(STORAGE_KEYS.MONTHLY_REPORTS, list.filter(r => r.id !== id));
  }

  // Global Settings
  public getGlobalSettings(): GlobalSettings {
    return this.get<GlobalSettings>(STORAGE_KEYS.GLOBAL_SETTINGS, initialGlobalSettings);
  }

  public saveGlobalSettings(settings: GlobalSettings): void {
    this.set(STORAGE_KEYS.GLOBAL_SETTINGS, settings);
  }

  // Sync Jobs
  public getSyncJobs(websiteId?: string): SyncJob[] {
    const list = this.get<SyncJob[]>(STORAGE_KEYS.SYNC_JOBS, initialSyncJobs);
    if (websiteId) {
      return list.filter(j => j.websiteId === websiteId);
    }
    return list;
  }

  public addSyncJob(job: SyncJob): void {
    const list = this.getSyncJobs();
    list.unshift(job);
    this.set(STORAGE_KEYS.SYNC_JOBS, list.slice(0, 100)); // keep last 100
  }

  // Installer State
  public getInstallerState(): InstallerState {
    return this.get<InstallerState>(STORAGE_KEYS.INSTALLER_STATE, initialInstallerState);
  }

  public saveInstallerState(state: InstallerState): void {
    this.set(STORAGE_KEYS.INSTALLER_STATE, state);
  }
  // Global Settings aliases
  public getSettings(): GlobalSettings {
    return this.getGlobalSettings();
  }

  public saveSettings(settings: GlobalSettings): void {
    this.saveGlobalSettings(settings);
  }

  public saveSyncJob(job: SyncJob): void {
    this.addSyncJob(job);
  }

  public saveAuthUser(user: AuthUser): void {
    this.setAuthUser(user);
  }

  public logout(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  }
}

export const storage = new StorageService();
storage.init();
