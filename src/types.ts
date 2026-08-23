export type WebsiteStatus = 'active' | 'paused' | 'archived' | 'deleted';

export interface Website {
  id: string;
  name: string;
  domain: string;
  timezone: string;
  status: WebsiteStatus;
  brandTerms: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  gaPropertyId?: string;
  gscSiteUrl?: string;
  // Overrides
  retentionDaysOverride?: number;
  trafficDeclineThreshold?: number; // % drop threshold, default 20
  rankTrackingCadence?: 'monthly' | 'on_demand' | 'weekly';
  defaultCountry?: string;
  defaultLanguage?: string;
  defaultDevice?: 'desktop' | 'mobile';
}

export interface GaConnection {
  id?: string;
  websiteId: string;
  status: 'connected' | 'paused' | 'error' | 'disconnected';
  propertyId: string;
  propertyName?: string;
  accountEmail?: string;
  connectedAccountEmail?: string;
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
  lastSyncAt?: string | null;
  lastSyncedAt?: string | null;
  lastSyncStatus?: 'success' | 'failed' | 'in_progress' | 'idle';
  lastError?: string;
  autoSyncEnabled?: boolean;
  syncFrequency?: 'daily' | 'hourly';
  createdAt?: string;
}

export interface GscConnection {
  id?: string;
  websiteId: string;
  status: 'connected' | 'paused' | 'error' | 'disconnected';
  siteUrl: string; // e.g., https://example.com/ or sc-domain:example.com
  propertyType?: 'url_prefix' | 'domain';
  accountEmail?: string;
  connectedAccountEmail?: string;
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
  lastSyncAt?: string | null;
  lastSyncedAt?: string | null;
  lastSyncStatus?: 'success' | 'failed' | 'in_progress' | 'idle';
  lastError?: string;
  autoSyncEnabled?: boolean;
  syncFrequency?: 'daily' | 'hourly';
  createdAt?: string;
}

export interface PageMetricDaily {
  id: string;
  websiteId: string;
  date: string; // YYYY-MM-DD
  pagePath: string; // /blog/seo-guide
  fullUrl: string;
  hostname: string;
  cleanPath: string;
  category: string;
  source: string; // google, direct, referral, etc.
  medium: string; // organic, cpc, referral, none
  channelGroup: string; // Organic Search, Direct, Referral, Social
  country: string;
  device: 'desktop' | 'mobile' | 'tablet';
  sessions: number;
  users: number;
  engagedSessions: number;
  engagementRate: number;
  conversions: number;
}

export interface GscQueryMetricDaily {
  id: string;
  websiteId: string;
  date: string;
  pageUrl: string;
  cleanPath: string;
  query: string;
  isBranded: boolean;
  category: string;
  country: string;
  device: 'desktop' | 'mobile' | 'tablet';
  clicks: number;
  impressions: number;
  ctr: number; // 0 to 1 or %
  position: number; // 1 to 100+
}

export type NavTab =
  | 'dashboard'
  | 'declining_pages'
  | 'optimization_pipeline'
  | 'all_pages'
  | 'keywords'
  | 'insights'
  | 'activities'
  | 'reports'
  | 'connections'
  | 'websites'
  | 'category_rules'
  | 'sync_logs'
  | 'deployment'
  | 'settings'
  | 'code_package'
  | 'installer';

export type PageIndexStatus =
  | 'indexed'
  | 'crawled_not_indexed'
  | 'discovered_not_indexed'
  | 'excluded_noindex'
  | 'duplicate_no_canonical'
  | 'not_found_404';

export interface SubmittedPageItem {
  id: string;
  websiteId: string;
  pageUrl: string;
  cleanPath: string;
  title: string;
  category: string;
  indexStatus: PageIndexStatus;
  indexStatusLabel: string;
  lastCrawledAt: string;
  sitemapSubmitted: boolean;
  totalSessions: number;
  totalClicks: number;
  totalImpressions: number;
  avgPosition: number;
  ctr: number;
  isZeroTraffic: boolean;
  isZeroImpressions: boolean;
  isTopPerformer: boolean;
  topQueries: {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    isBranded?: boolean;
  }[];
  mobileUsability: 'good' | 'needs_improvement' | 'poor';
  coreWebVitals: 'good' | 'needs_improvement' | 'poor';
  diagnosisNote?: string;
}

export type KeywordPriority = 'low' | 'medium' | 'high' | 'critical';
export type KeywordIntent = 'informational' | 'commercial' | 'transactional' | 'navigational';
export type KeywordStatus = 'active' | 'paused' | 'archived';

export interface Keyword {
  id: string;
  websiteId: string;
  keyword: string;
  targetUrl: string;
  priority: KeywordPriority;
  category: string;
  intent: KeywordIntent;
  tags: string[];
  country: string;
  language: string;
  device: 'desktop' | 'mobile';
  status: KeywordStatus;
  isBranded: boolean;
  currentRank: number | null;
  previousRank: number | null;
  bestRank: number | null;
  rankedUrl?: string;
  serpFeatures?: string[];
  lastTrackedAt: string | null;
  createdAt: string;
}

export interface KeywordRankSnapshot {
  id: string;
  keywordId: string;
  websiteId: string;
  snapshotDate: string;
  keyword: string;
  rank: number | null; // null if > 100 or unranked
  previousRank: number | null;
  rankChange: number; // e.g. +3 (improved) or -5 (dropped)
  rankedUrl: string | null;
  country: string;
  language: string;
  device: 'desktop' | 'mobile';
  serpFeatures?: string[];
}

export type MatchType = 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'exact' | 'glob' | 'query_param';

export interface CategoryRule {
  id: string;
  websiteId: string;
  name: string;
  targetType: 'url' | 'keyword' | 'query';
  matchType: MatchType;
  pattern: string;
  category: string;
  priority: number;
  isActive?: boolean;
  createdAt: string;
}

export type DecliningPriority = 'critical' | 'high' | 'medium' | 'low';
export type PriorityLevel = DecliningPriority;

export interface PageResearchBreakdown {
  brandClicks: number;
  prevBrandClicks: number;
  brandLoss: number;
  brandLossPct: number;
  brandImpressions: number;
  prevBrandImpressions: number;
  brandImpLoss: number;
  brandImpLossPct: number;
  brandCtr: number;
  prevBrandCtr: number;
  brandAvgPosition: number;
  prevBrandAvgPosition: number;
  brandQueriesCount: number;

  nonBrandClicks: number;
  prevNonBrandClicks: number;
  nonBrandLoss: number;
  nonBrandLossPct: number;
  nonBrandImpressions: number;
  prevNonBrandImpressions: number;
  nonBrandImpLoss: number;
  nonBrandImpLossPct: number;
  nonBrandCtr: number;
  prevNonBrandCtr: number;
  nonBrandAvgPosition: number;
  prevNonBrandAvgPosition: number;
  nonBrandQueriesCount: number;

  isBrandDeclining: boolean;
  isNonBrandDeclining: boolean;
  
  // CTR vs Impression vs Ranking Root Cause Diagnosis
  ctrStatus: 'severe_drop' | 'mild_drop' | 'stable' | 'improved';
  impressionsStatus: 'severe_drop' | 'mild_drop' | 'stable' | 'improved';
  rankingStatus: 'severe_drop' | 'mild_drop' | 'stable' | 'improved';
  primaryFactor: 'ctr_collapse' | 'impression_decay' | 'ranking_drop' | 'mixed_decay';
  primaryFactorLabel: string;
  factorExplanation: string;
  
  // SERP Features and Displacements
  serpFeatureShifts: string[];
  detectedCannibalization?: {
    conflictingUrl: string;
    sharedQuery: string;
    cannibalizedClicks: number;
  } | null;
  
  // Remediation Action Plan
  actionPlan: {
    title: string;
    category: string;
    priority: 'critical' | 'high' | 'medium';
    action: string;
  }[];
}

export interface KeywordResearchData {
  keyword: string;
  websiteId: string;
  currentRank: number | null;
  previousRank: number | null;
  rankChange: number;
  bestRank: number | null;
  isBranded: boolean;
  category: string;
  intent: string;
  targetUrl: string;
  
  // Traffic & SERP Metrics
  estimatedSearchVolume: number;
  estimatedClickLoss: number;
  currentEstimatedCtr: number;
  benchmarkExpectedCtr: number;
  isCtrDegraded: boolean;
  
  // Root Cause Diagnosis
  primaryDropReason: 'ai_overview_displacement' | 'competitor_leapfrog' | 'intent_drift' | 'content_staleness' | 'cannibalization' | 'technical_crawl' | 'brand_erosion';
  primaryDropReasonLabel: string;
  dropSeverity: 'critical' | 'high' | 'medium' | 'low';
  diagnosisNarrative: string;
  
  // SERP Layout & Competitors
  serpFeaturesPresent: string[];
  topCompetitorsDisplacing: {
    domain: string;
    url: string;
    rank: number;
    title: string;
    advantage: string;
  }[];
  
  // Cannibalization check
  cannibalizationDetected: boolean;
  cannibalizingUrl?: string;
  
  // 30-day Rank History
  rankHistory: { date: string; rank: number | null }[];
  
  // Recommended Fixes
  remediationSteps: {
    step: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }[];
}

export interface DecliningPageItem {
  pageUrl: string;
  cleanPath: string;
  pageCategory: string;
  currentSessions: number;
  previousSessions: number;
  sessionChange: number;
  absoluteLoss: number;
  dropPercentage: number;
  currentClicks: number;
  previousClicks: number;
  clickChange: number;
  currentImpressions: number;
  previousImpressions: number;
  currentCtr: number;
  previousCtr: number;
  currentAvgPosition: number;
  previousAvgPosition: number;
  conversionsLoss: number;
  priorityScore: number; // 0 - 100
  priorityLevel: DecliningPriority;
  suggestedAction: string;
  topLosingQueries: {
    query: string;
    previousClicks: number;
    currentClicks: number;
    clickLoss: number;
    previousPosition: number;
    currentPosition: number;
  }[];
  research?: PageResearchBreakdown;
  dateRangeLabel?: string;
  comparisonPeriodLabel?: string;
}

export type InsightType =
  | 'traffic_decline'
  | 'ranking_drop'
  | 'ctr_opportunity'
  | 'cannibalization'
  | 'content_decay'
  | 'rising_query'
  | 'keyword_win'
  | 'conversion_drop'
  | 'source_decline'
  | 'category_decline';

export type InsightSeverity = 'critical' | 'high' | 'medium' | 'info';

export interface Insight {
  id: string;
  websiteId: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  relatedPageUrl?: string;
  relatedKeyword?: string;
  metricContext: Record<string, any>;
  status: 'active' | 'resolved' | 'dismissed' | 'converted_to_activity';
  createdAt: string;
}

export type ActivityType =
  | 'content_refresh'
  | 'new_content'
  | 'title_meta_improvement'
  | 'internal_linking'
  | 'keyword_targeting'
  | 'cannibalization_fix'
  | 'ctr_optimization'
  | 'technical_review'
  | 'conversion_optimization'
  | 'link_building';

export type ActivityStatus =
  | 'suggested'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'ignored'
  | 'snoozed';

export type EffortLevel = 'low' | 'medium' | 'high';
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Activity {
  id: string;
  websiteId: string;
  title: string;
  description: string;
  type: ActivityType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: EffortLevel;
  impact: ImpactLevel;
  relatedPageUrl?: string;
  relatedKeyword?: string;
  month: string; // YYYY-MM
  status: ActivityStatus;
  assignedUser?: string;
  dueDate?: string;
  notes?: string;
  plannedDate?: string;
  startedDate?: string;
  completedDate?: string;
  sourceInsightId?: string;
  createdAt: string;
}

export type OptimizationOutcome = 'positive_win' | 'measuring' | 'neutral' | 'negative_regression';

export interface OptimizationTimelineEvent {
  id: string;
  activityId: string;
  title: string;
  type: ActivityType;
  status: ActivityStatus;
  plannedDate: string;
  startedDate?: string;
  completedDate?: string;
  assignedUser?: string;
  effort?: EffortLevel;
  impact?: ImpactLevel;
  notes?: string;
}

export interface OptimizationMetricsComparison {
  baselineSessions: number;
  currentSessions: number;
  sessionsChange: number;
  sessionsChangePct: number;

  baselineClicks: number;
  currentClicks: number;
  clicksChange: number;
  clicksChangePct: number;

  baselineImpressions: number;
  currentImpressions: number;

  baselinePosition: number;
  currentPosition: number;
  positionChange: number; // e.g. -3.3 means rank improved from 7.4 to 4.1

  baselineCtr: number;
  currentCtr: number;
}

export interface OptimizationPipelineItem {
  id: string;
  websiteId: string;
  pageUrl: string;
  cleanPath: string;
  category: string; // Dynamically resolved by Category & Classification Rules
  stage: 'planned' | 'in_progress' | 'measuring' | 'completed';
  outcome: OptimizationOutcome;
  outcomeLabel: string;
  outcomeScore: number; // 0-100

  // Multi-activity tracking
  activitiesCount: number;
  completedActivitiesCount: number;
  inProgressActivitiesCount: number;
  plannedActivitiesCount: number;
  timeline: OptimizationTimelineEvent[];

  firstPlannedDate: string;
  lastActivityDate: string;
  lastCompletedDate?: string;

  // Before vs After Metrics
  metrics: OptimizationMetricsComparison;

  primaryKeyword?: string;
  notes?: string;
}

export interface MonthlyReport {
  id: string;
  websiteId: string;
  month: string; // e.g. "2026-07"
  title: string;
  createdAt: string;
  config: {
    agencyName?: string;
    clientName?: string;
    logoUrl?: string;
    brandColor?: string;
    footerText?: string;
    customIntro?: string;
    manualNotes?: string;
    sections: {
      executiveSummary: boolean;
      trafficOverview: boolean;
      organicSearch: boolean;
      topPages: boolean;
      growingPages: boolean;
      decliningPages: boolean;
      categoryPerformance: boolean;
      brandVsNonBrand: boolean;
      sourceBreakdown: boolean;
      keywordMovement: boolean;
      completedActivities: boolean;
      nextMonthPlan: boolean;
      recommendations: boolean;
    };
    topLimit: number;
  };
  snapshotData: {
    executiveSummary: {
      totalSessions: number;
      sessionsGrowthMoM: number;
      organicClicks: number;
      clicksGrowthMoM: number;
      topKeywordCount: number;
      completedTasksCount: number;
      keyHighlight: string;
    };
    trafficOverview: {
      totalSessions: number;
      previousSessions: number;
      organicSessions: number;
      engagedSessions: number;
      avgEngagementRate: number;
      totalConversions: number;
      dailyTrends: { date: string; sessions: number; clicks: number }[];
    };
    organicSearch: {
      totalClicks: number;
      previousClicks: number;
      totalImpressions: number;
      previousImpressions: number;
      avgCtr: number;
      avgPosition: number;
    };
    topPages: { path: string; category: string; sessions: number; clicks: number; changePct: number }[];
    growingPages: { path: string; category: string; sessionGain: number; currentSessions: number }[];
    decliningPages: { path: string; category: string; sessionLoss: number; currentSessions: number }[];
    categoryPerformance: { category: string; sessions: number; clicks: number; sharePct: number }[];
    brandVsNonBrand: {
      brandedClicks: number;
      nonBrandedClicks: number;
      brandedImpressions: number;
      nonBrandedImpressions: number;
    };
    sourceBreakdown: { source: string; channel: string; sessions: number; sharePct: number }[];
    keywordSummary: {
      trackedTotal: number;
      top3Count: number;
      top10Count: number;
      improvedCount: number;
      declinedCount: number;
      newRankings: number;
      lostRankings: number;
      topMovements: { keyword: string; oldRank: number; newRank: number; change: number }[];
    };
    completedActivities: { title: string; type: string; impact: string; completedDate: string }[];
    nextMonthPlan: { title: string; type: string; priority: string; impact: string }[];
    recommendations: string[];
  };
}

export interface AiSettings {
  enabled: boolean;
  provider: 'gemini' | 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  model: string;
  customEndpoint?: string;
  temperature?: number;
}

export interface GlobalSettings {
  appName: string;
  timezone: string;
  dateFormat: string;
  defaultReportDay: number; // day of month (e.g. 1st)
  googleClientId: string;
  googleClientSecret: string;
  brightDataApiToken: string;
  brightDataZone: string;
  brightDataDepthLimit: number; // default 100
  defaultRetentionDaysDailyMetrics: number; // e.g. 365
  defaultRetentionDaysGscQueries: number; // e.g. 180
  defaultRetentionDaysRankSnapshots: number; // e.g. 730
  defaultRetentionDaysSyncLogs: number; // e.g. 60
  storeRawApiResponses: boolean;
  cronSecretToken: string;
  emailNotifications: boolean;
  notificationEmail: string;
  aiSettings?: AiSettings;
}

export type AppSettings = GlobalSettings;

export interface SyncJob {
  id: string;
  websiteId: string;
  jobType: 'ga4_daily_sync' | 'gsc_daily_sync' | 'brightdata_rank_check' | 'monthly_activity_gen' | 'monthly_report_gen' | 'data_cleanup';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  endedAt?: string;
  lastSyncedDate?: string;
  attempts: number;
  recordsProcessed: number;
  errorMessage?: string;
}

export interface InstallerState {
  isInstalled: boolean;
  installedAt?: string;
  phpVersion: string;
  requirements: {
    phpVersionOk: boolean;
    pdoMysql: boolean;
    curl: boolean;
    openssl: boolean;
    mbstring: boolean;
    json: boolean;
    writableFolders: boolean;
  };
  dbConfig: {
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
    tablePrefix: string;
  };
  adminUser: {
    email: string;
    name: string;
    password?: string;
  };
  appKey: string;
  cronToken: string;
}
