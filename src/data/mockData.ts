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
  InstallerState
} from '../types';

export const initialWebsites: Website[] = [
  {
    id: 'site-acme',
    name: 'Acme SaaS Suite',
    domain: 'acmesoftware.io',
    timezone: 'America/New_York',
    status: 'active',
    brandTerms: ['acme', 'acmesoftware', 'acme saas', 'acme app', 'acme login'],
    notes: 'Primary B2B workspace productivity SaaS. Focus on mid-market SEO & product comparisons.',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-08-20T14:30:00Z',
    gaPropertyId: '394820194',
    gscSiteUrl: 'https://acmesoftware.io/',
    trafficDeclineThreshold: 20,
    defaultCountry: 'USA',
    defaultLanguage: 'en',
    defaultDevice: 'desktop'
  },
  {
    id: 'site-brew',
    name: 'The Brew Guide',
    domain: 'thebrewguide.com',
    timezone: 'Europe/London',
    status: 'active',
    brandTerms: ['brew guide', 'thebrewguide', 'the brew guide', 'brewguide'],
    notes: 'Coffee brewing gear reviews, beans comparisons, and extraction tutorials.',
    createdAt: '2026-02-10T10:15:00Z',
    updatedAt: '2026-08-19T09:00:00Z',
    gaPropertyId: '410928340',
    gscSiteUrl: 'sc-domain:thebrewguide.com',
    trafficDeclineThreshold: 25,
    defaultCountry: 'GBR',
    defaultLanguage: 'en',
    defaultDevice: 'mobile'
  },
  {
    id: 'site-northstar',
    name: 'Northstar Tech Legal',
    domain: 'northstarlegal.com',
    timezone: 'America/Los_Angeles',
    status: 'paused',
    brandTerms: ['northstar', 'northstar legal', 'northstar tech law'],
    notes: 'Venture & IP legal advisory for tech startups. Paused temporarily for site redesign.',
    createdAt: '2026-03-01T12:00:00Z',
    updatedAt: '2026-08-10T16:45:00Z',
    gaPropertyId: '381920491',
    gscSiteUrl: 'https://northstarlegal.com/',
    trafficDeclineThreshold: 20,
    defaultCountry: 'USA',
    defaultLanguage: 'en',
    defaultDevice: 'desktop'
  }
];

export const initialGaConnections: Record<string, GaConnection> = {
  'site-acme': {
    websiteId: 'site-acme',
    status: 'connected',
    propertyId: '394820194',
    propertyName: 'Acme SaaS Production (GA4)',
    accountEmail: 'admin@acmesoftware.io',
    accessTokenEncrypted: 'enc_ga_tok_9381749817234',
    refreshTokenEncrypted: 'enc_ga_ref_8123984719234',
    lastSyncAt: '2026-08-21T06:00:00Z',
    lastSyncStatus: 'success',
    autoSyncEnabled: true
  },
  'site-brew': {
    websiteId: 'site-brew',
    status: 'connected',
    propertyId: '410928340',
    propertyName: 'The Brew Guide Main',
    accountEmail: 'editor@thebrewguide.com',
    accessTokenEncrypted: 'enc_ga_tok_1092384719283',
    refreshTokenEncrypted: 'enc_ga_ref_4918237491823',
    lastSyncAt: '2026-08-21T06:15:00Z',
    lastSyncStatus: 'success',
    autoSyncEnabled: true
  },
  'site-northstar': {
    websiteId: 'site-northstar',
    status: 'paused',
    propertyId: '381920491',
    propertyName: 'Northstar Legal Web',
    accountEmail: 'partner@northstarlegal.com',
    accessTokenEncrypted: 'enc_ga_tok_3918237491823',
    refreshTokenEncrypted: 'enc_ga_ref_5819238471923',
    lastSyncAt: '2026-08-10T06:00:00Z',
    lastSyncStatus: 'idle',
    autoSyncEnabled: false
  }
};

export const initialGscConnections: Record<string, GscConnection> = {
  'site-acme': {
    websiteId: 'site-acme',
    status: 'connected',
    siteUrl: 'https://acmesoftware.io/',
    propertyType: 'url_prefix',
    accountEmail: 'admin@acmesoftware.io',
    accessTokenEncrypted: 'enc_gsc_tok_4918237491823',
    refreshTokenEncrypted: 'enc_gsc_ref_9381749817234',
    lastSyncAt: '2026-08-21T06:05:00Z',
    lastSyncStatus: 'success',
    autoSyncEnabled: true
  },
  'site-brew': {
    websiteId: 'site-brew',
    status: 'connected',
    siteUrl: 'sc-domain:thebrewguide.com',
    propertyType: 'domain',
    accountEmail: 'editor@thebrewguide.com',
    accessTokenEncrypted: 'enc_gsc_tok_5819238471923',
    refreshTokenEncrypted: 'enc_gsc_ref_1092384719283',
    lastSyncAt: '2026-08-21T06:20:00Z',
    lastSyncStatus: 'success',
    autoSyncEnabled: true
  },
  'site-northstar': {
    websiteId: 'site-northstar',
    status: 'paused',
    siteUrl: 'https://northstarlegal.com/',
    propertyType: 'url_prefix',
    accountEmail: 'partner@northstarlegal.com',
    accessTokenEncrypted: 'enc_gsc_tok_2918237491823',
    refreshTokenEncrypted: 'enc_gsc_ref_3918237491823',
    lastSyncAt: '2026-08-10T06:05:00Z',
    lastSyncStatus: 'idle',
    autoSyncEnabled: false
  }
};

export const initialCategoryRules: CategoryRule[] = [
  {
    id: 'rule-1',
    websiteId: 'site-acme',
    name: 'Blog Articles',
    targetType: 'url',
    matchType: 'starts_with',
    pattern: '/blog',
    category: 'Blog',
    priority: 10,
    createdAt: '2026-01-20T00:00:00Z'
  },
  {
    id: 'rule-2',
    websiteId: 'site-acme',
    name: 'Product & Features',
    targetType: 'url',
    matchType: 'starts_with',
    pattern: '/features',
    category: 'Features',
    priority: 20,
    createdAt: '2026-01-20T00:00:00Z'
  },
  {
    id: 'rule-3',
    websiteId: 'site-acme',
    name: 'Pricing Page',
    targetType: 'url',
    matchType: 'contains',
    pattern: 'pricing',
    category: 'Pricing',
    priority: 15,
    createdAt: '2026-01-20T00:00:00Z'
  },
  {
    id: 'rule-4',
    websiteId: 'site-acme',
    name: 'Software Comparisons',
    targetType: 'url',
    matchType: 'contains',
    pattern: '/vs/',
    category: 'Comparison',
    priority: 25,
    createdAt: '2026-01-20T00:00:00Z'
  },
  {
    id: 'rule-5',
    websiteId: 'site-acme',
    name: 'Documentation & Guides',
    targetType: 'url',
    matchType: 'starts_with',
    pattern: '/docs',
    category: 'Documentation',
    priority: 30,
    createdAt: '2026-01-20T00:00:00Z'
  },
  {
    id: 'rule-6',
    websiteId: 'site-acme',
    name: 'Commercial Keywords',
    targetType: 'keyword',
    matchType: 'contains',
    pattern: 'pricing|cost|software|tool|app|service|platform',
    category: 'Commercial',
    priority: 10,
    createdAt: '2026-01-20T00:00:00Z'
  },
  {
    id: 'rule-7',
    websiteId: 'site-brew',
    name: 'Reviews & Guides',
    targetType: 'url',
    matchType: 'starts_with',
    pattern: '/reviews',
    category: 'Product Review',
    priority: 10,
    createdAt: '2026-02-15T00:00:00Z'
  }
];

export const initialKeywords: Keyword[] = [
  {
    id: 'kw-1',
    websiteId: 'site-acme',
    keyword: 'team collaboration software',
    targetUrl: 'https://acmesoftware.io/features/collaboration',
    priority: 'critical',
    category: 'Commercial',
    intent: 'commercial',
    tags: ['core-product', 'q3-push'],
    country: 'USA',
    language: 'en',
    device: 'desktop',
    status: 'active',
    isBranded: false,
    currentRank: 4,
    previousRank: 7,
    bestRank: 3,
    rankedUrl: 'https://acmesoftware.io/features/collaboration',
    serpFeatures: ['people_also_ask', 'site_links'],
    lastTrackedAt: '2026-08-20T03:00:00Z',
    createdAt: '2026-01-20T00:00:00Z'
  },
  {
    id: 'kw-2',
    websiteId: 'site-acme',
    keyword: 'cloud kanban board tool',
    targetUrl: 'https://acmesoftware.io/features/kanban',
    priority: 'high',
    category: 'Commercial',
    intent: 'transactional',
    tags: ['features', 'high-intent'],
    country: 'USA',
    language: 'en',
    device: 'desktop',
    status: 'active',
    isBranded: false,
    currentRank: 12,
    previousRank: 6,
    bestRank: 5,
    rankedUrl: 'https://acmesoftware.io/features/kanban',
    serpFeatures: ['featured_snippet'],
    lastTrackedAt: '2026-08-20T03:00:00Z',
    createdAt: '2026-01-20T00:00:00Z'
  },
  {
    id: 'kw-3',
    websiteId: 'site-acme',
    keyword: 'acme saas login',
    targetUrl: 'https://acmesoftware.io/login',
    priority: 'high',
    category: 'Brand',
    intent: 'navigational',
    tags: ['brand', 'login'],
    country: 'USA',
    language: 'en',
    device: 'desktop',
    status: 'active',
    isBranded: true,
    currentRank: 1,
    previousRank: 1,
    bestRank: 1,
    rankedUrl: 'https://acmesoftware.io/login',
    serpFeatures: ['site_links'],
    lastTrackedAt: '2026-08-20T03:00:00Z',
    createdAt: '2026-01-20T00:00:00Z'
  },
  {
    id: 'kw-4',
    websiteId: 'site-acme',
    keyword: 'asynchronous team communication best practices',
    targetUrl: 'https://acmesoftware.io/blog/async-communication-guide',
    priority: 'medium',
    category: 'Informational',
    intent: 'informational',
    tags: ['top-of-funnel', 'blog'],
    country: 'USA',
    language: 'en',
    device: 'desktop',
    status: 'active',
    isBranded: false,
    currentRank: 8,
    previousRank: 4,
    bestRank: 2,
    rankedUrl: 'https://acmesoftware.io/blog/async-communication-guide',
    serpFeatures: ['people_also_ask'],
    lastTrackedAt: '2026-08-20T03:00:00Z',
    createdAt: '2026-01-25T00:00:00Z'
  },
  {
    id: 'kw-5',
    websiteId: 'site-acme',
    keyword: 'acme vs trello comparison',
    targetUrl: 'https://acmesoftware.io/vs/trello',
    priority: 'high',
    category: 'Comparison',
    intent: 'commercial',
    tags: ['competitor', 'high-converting'],
    country: 'USA',
    language: 'en',
    device: 'desktop',
    status: 'active',
    isBranded: true,
    currentRank: 2,
    previousRank: 2,
    bestRank: 2,
    rankedUrl: 'https://acmesoftware.io/vs/trello',
    serpFeatures: ['featured_snippet'],
    lastTrackedAt: '2026-08-20T03:00:00Z',
    createdAt: '2026-02-01T00:00:00Z'
  },
  {
    id: 'kw-6',
    websiteId: 'site-acme',
    keyword: 'remote sprint planning templates',
    targetUrl: 'https://acmesoftware.io/blog/sprint-planning-template',
    priority: 'medium',
    category: 'Informational',
    intent: 'informational',
    tags: ['templates', 'lead-gen'],
    country: 'USA',
    language: 'en',
    device: 'desktop',
    status: 'active',
    isBranded: false,
    currentRank: 19,
    previousRank: 11,
    bestRank: 9,
    rankedUrl: 'https://acmesoftware.io/blog/sprint-planning-template',
    serpFeatures: [],
    lastTrackedAt: '2026-08-20T03:00:00Z',
    createdAt: '2026-02-15T00:00:00Z'
  },
  {
    id: 'kw-7',
    websiteId: 'site-acme',
    keyword: 'enterprise workflow automation suite',
    targetUrl: 'https://acmesoftware.io/features/automation',
    priority: 'critical',
    category: 'Commercial',
    intent: 'transactional',
    tags: ['enterprise', 'high-acv'],
    country: 'USA',
    language: 'en',
    device: 'desktop',
    status: 'active',
    isBranded: false,
    currentRank: 5,
    previousRank: 9,
    bestRank: 5,
    rankedUrl: 'https://acmesoftware.io/features/automation',
    serpFeatures: ['knowledge_panel'],
    lastTrackedAt: '2026-08-20T03:00:00Z',
    createdAt: '2026-03-01T00:00:00Z'
  },
  {
    id: 'kw-8',
    websiteId: 'site-brew',
    keyword: 'best espresso machine under 500',
    targetUrl: 'https://thebrewguide.com/reviews/best-espresso-machines-under-500',
    priority: 'critical',
    category: 'Product Review',
    intent: 'commercial',
    tags: ['affiliate', 'high-revenue'],
    country: 'GBR',
    language: 'en',
    device: 'mobile',
    status: 'active',
    isBranded: false,
    currentRank: 3,
    previousRank: 2,
    bestRank: 1,
    rankedUrl: 'https://thebrewguide.com/reviews/best-espresso-machines-under-500',
    serpFeatures: ['image_pack', 'shopping_ads'],
    lastTrackedAt: '2026-08-20T03:00:00Z',
    createdAt: '2026-02-20T00:00:00Z'
  }
];

export const initialRankSnapshots: KeywordRankSnapshot[] = [
  // kw-1 history
  { id: 'snap-1', keywordId: 'kw-1', websiteId: 'site-acme', snapshotDate: '2026-08-06', keyword: 'team collaboration software', rank: 9, previousRank: 10, rankChange: 1, rankedUrl: 'https://acmesoftware.io/features/collaboration', country: 'USA', language: 'en', device: 'desktop' },
  { id: 'snap-2', keywordId: 'kw-1', websiteId: 'site-acme', snapshotDate: '2026-08-13', keyword: 'team collaboration software', rank: 7, previousRank: 9, rankChange: 2, rankedUrl: 'https://acmesoftware.io/features/collaboration', country: 'USA', language: 'en', device: 'desktop' },
  { id: 'snap-3', keywordId: 'kw-1', websiteId: 'site-acme', snapshotDate: '2026-08-20', keyword: 'team collaboration software', rank: 4, previousRank: 7, rankChange: 3, rankedUrl: 'https://acmesoftware.io/features/collaboration', country: 'USA', language: 'en', device: 'desktop' },

  // kw-2 history (dropped)
  { id: 'snap-4', keywordId: 'kw-2', websiteId: 'site-acme', snapshotDate: '2026-08-06', keyword: 'cloud kanban board tool', rank: 5, previousRank: 4, rankChange: -1, rankedUrl: 'https://acmesoftware.io/features/kanban', country: 'USA', language: 'en', device: 'desktop' },
  { id: 'snap-5', keywordId: 'kw-2', websiteId: 'site-acme', snapshotDate: '2026-08-13', keyword: 'cloud kanban board tool', rank: 6, previousRank: 5, rankChange: -1, rankedUrl: 'https://acmesoftware.io/features/kanban', country: 'USA', language: 'en', device: 'desktop' },
  { id: 'snap-6', keywordId: 'kw-2', websiteId: 'site-acme', snapshotDate: '2026-08-20', keyword: 'cloud kanban board tool', rank: 12, previousRank: 6, rankChange: -6, rankedUrl: 'https://acmesoftware.io/features/kanban', country: 'USA', language: 'en', device: 'desktop' },

  // kw-4 history (dropped)
  { id: 'snap-7', keywordId: 'kw-4', websiteId: 'site-acme', snapshotDate: '2026-08-06', keyword: 'asynchronous team communication best practices', rank: 3, previousRank: 2, rankChange: -1, rankedUrl: 'https://acmesoftware.io/blog/async-communication-guide', country: 'USA', language: 'en', device: 'desktop' },
  { id: 'snap-8', keywordId: 'kw-4', websiteId: 'site-acme', snapshotDate: '2026-08-13', keyword: 'asynchronous team communication best practices', rank: 4, previousRank: 3, rankChange: -1, rankedUrl: 'https://acmesoftware.io/blog/async-communication-guide', country: 'USA', language: 'en', device: 'desktop' },
  { id: 'snap-9', keywordId: 'kw-4', websiteId: 'site-acme', snapshotDate: '2026-08-20', keyword: 'asynchronous team communication best practices', rank: 8, previousRank: 4, rankChange: -4, rankedUrl: 'https://acmesoftware.io/blog/async-communication-guide', country: 'USA', language: 'en', device: 'desktop' },

  // kw-6 history
  { id: 'snap-10', keywordId: 'kw-6', websiteId: 'site-acme', snapshotDate: '2026-08-06', keyword: 'remote sprint planning templates', rank: 10, previousRank: 9, rankChange: -1, rankedUrl: 'https://acmesoftware.io/blog/sprint-planning-template', country: 'USA', language: 'en', device: 'desktop' },
  { id: 'snap-11', keywordId: 'kw-6', websiteId: 'site-acme', snapshotDate: '2026-08-13', keyword: 'remote sprint planning templates', rank: 11, previousRank: 10, rankChange: -1, rankedUrl: 'https://acmesoftware.io/blog/sprint-planning-template', country: 'USA', language: 'en', device: 'desktop' },
  { id: 'snap-12', keywordId: 'kw-6', websiteId: 'site-acme', snapshotDate: '2026-08-20', keyword: 'remote sprint planning templates', rank: 19, previousRank: 11, rankChange: -8, rankedUrl: 'https://acmesoftware.io/blog/sprint-planning-template', country: 'USA', language: 'en', device: 'desktop' }
];

// Helper to generate simulated daily page metrics for past 60 days
export function generateMockPageMetrics(): PageMetricDaily[] {
  const metrics: PageMetricDaily[] = [];
  const pages = [
    { path: '/blog/async-communication-guide', cat: 'Blog', baseSessions: 380, dropDay: 30, dropFactor: 0.52 },
    { path: '/features/kanban', cat: 'Features', baseSessions: 520, dropDay: 20, dropFactor: 0.65 },
    { path: '/blog/sprint-planning-template', cat: 'Blog', baseSessions: 290, dropDay: 25, dropFactor: 0.48 },
    { path: '/pricing', cat: 'Pricing', baseSessions: 640, dropDay: 999, dropFactor: 1.05 },
    { path: '/features/collaboration', cat: 'Features', baseSessions: 780, dropDay: 999, dropFactor: 1.22 },
    { path: '/vs/trello', cat: 'Comparison', baseSessions: 410, dropDay: 999, dropFactor: 1.08 },
    { path: '/docs/getting-started', cat: 'Documentation', baseSessions: 210, dropDay: 999, dropFactor: 0.98 },
    { path: '/blog/remote-work-burnout', cat: 'Blog', baseSessions: 180, dropDay: 35, dropFactor: 0.60 },
    { path: '/features/automation', cat: 'Features', baseSessions: 490, dropDay: 999, dropFactor: 1.30 },
    { path: '/blog/hybrid-meeting-rules', cat: 'Blog', baseSessions: 240, dropDay: 15, dropFactor: 0.55 }
  ];

  const now = new Date('2026-08-21T00:00:00Z');

  for (let d = 59; d >= 0; d--) {
    const targetDate = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().slice(0, 10);

    pages.forEach((p, idx) => {
      // simulate decline for some pages in recent 30 days
      const isPastDrop = d <= (60 - p.dropDay);
      const modifier = isPastDrop ? p.dropFactor : 1.0;
      const dayVariance = 0.88 + ((idx + d) % 25) * 0.01;
      const sessions = Math.max(12, Math.round(p.baseSessions * modifier * dayVariance));
      const users = Math.round(sessions * 0.84);
      const engaged = Math.round(sessions * 0.68);
      const rate = Number((engaged / sessions).toFixed(3));
      const conv = p.cat === 'Pricing' || p.cat === 'Features' ? Math.round(sessions * 0.045) : Math.round(sessions * 0.008);

      metrics.push({
        id: `pm-${idx}-${dateStr}`,
        websiteId: 'site-acme',
        date: dateStr,
        pagePath: p.path,
        fullUrl: `https://acmesoftware.io${p.path}`,
        hostname: 'acmesoftware.io',
        cleanPath: p.path,
        category: p.cat,
        source: 'google',
        medium: 'organic',
        channelGroup: 'Organic Search',
        country: 'USA',
        device: 'desktop',
        sessions,
        users,
        engagedSessions: engaged,
        engagementRate: rate,
        conversions: conv
      });
    });
  }

  return metrics;
}

export function generateMockGscMetrics(): GscQueryMetricDaily[] {
  const metrics: GscQueryMetricDaily[] = [];
  const querySets = [
    {
      page: '/blog/async-communication-guide',
      queries: [
        { q: 'asynchronous team communication best practices', baseClicks: 65, baseImp: 1200, dropDay: 28, dropFactor: 0.45, pos: 8.2, prevPos: 3.1 },
        { q: 'async communication tips for engineers', baseClicks: 40, baseImp: 850, dropDay: 25, dropFactor: 0.50, pos: 9.4, prevPos: 4.5 },
        { q: 'async vs sync remote team collaboration', baseClicks: 32, baseImp: 620, dropDay: 20, dropFactor: 0.55, pos: 11.2, prevPos: 5.0 },
        { q: 'how to do async meetings', baseClicks: 22, baseImp: 490, dropDay: 999, dropFactor: 0.90, pos: 6.8, prevPos: 6.5 }
      ]
    },
    {
      page: '/features/kanban',
      queries: [
        { q: 'cloud kanban board tool', baseClicks: 95, baseImp: 2100, dropDay: 20, dropFactor: 0.48, pos: 12.4, prevPos: 5.6 },
        { q: 'online agile kanban software', baseClicks: 60, baseImp: 1450, dropDay: 22, dropFactor: 0.52, pos: 14.1, prevPos: 6.8 },
        { q: 'best virtual kanban board for teams', baseClicks: 45, baseImp: 980, dropDay: 18, dropFactor: 0.60, pos: 10.8, prevPos: 7.2 }
      ]
    },
    {
      page: '/blog/sprint-planning-template',
      queries: [
        { q: 'remote sprint planning templates', baseClicks: 55, baseImp: 1600, dropDay: 25, dropFactor: 0.40, pos: 19.2, prevPos: 9.8 },
        { q: 'scrum sprint planning checklist doc', baseClicks: 35, baseImp: 920, dropDay: 22, dropFactor: 0.50, pos: 16.5, prevPos: 8.4 }
      ]
    },
    {
      page: '/features/collaboration',
      queries: [
        { q: 'team collaboration software', baseClicks: 140, baseImp: 3800, dropDay: 999, dropFactor: 1.35, pos: 4.1, prevPos: 7.4 },
        { q: 'enterprise team workspace tools', baseClicks: 80, baseImp: 1900, dropDay: 999, dropFactor: 1.20, pos: 5.2, prevPos: 8.0 }
      ]
    },
    {
      page: '/vs/trello',
      queries: [
        { q: 'acme vs trello comparison', baseClicks: 85, baseImp: 1100, dropDay: 999, dropFactor: 1.10, pos: 2.1, prevPos: 2.3 },
        { q: 'trello alternative for product teams', baseClicks: 70, baseImp: 1800, dropDay: 999, dropFactor: 1.15, pos: 3.8, prevPos: 4.2 }
      ]
    }
  ];

  const now = new Date('2026-08-21T00:00:00Z');

  for (let d = 59; d >= 0; d--) {
    const targetDate = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().slice(0, 10);

    querySets.forEach((qs, pIdx) => {
      qs.queries.forEach((qObj, qIdx) => {
        const isPastDrop = d <= (60 - qObj.dropDay);
        const modifier = isPastDrop ? qObj.dropFactor : 1.0;
        const curPos = isPastDrop ? qObj.pos : qObj.prevPos;
        const dayNoise = 0.85 + ((pIdx + qIdx + d) % 30) * 0.01;
        const clicks = Math.max(1, Math.round(qObj.baseClicks * modifier * dayNoise));
        const imp = Math.max(20, Math.round(qObj.baseImp * modifier * dayNoise));
        const ctr = Number((clicks / imp).toFixed(4));
        const isBrand = qObj.q.includes('acme');

        metrics.push({
          id: `gsc-${pIdx}-${qIdx}-${dateStr}`,
          websiteId: 'site-acme',
          date: dateStr,
          pageUrl: `https://acmesoftware.io${qs.page}`,
          cleanPath: qs.page,
          query: qObj.q,
          isBranded: isBrand,
          category: isBrand ? 'Brand' : 'Commercial',
          country: 'USA',
          device: 'desktop',
          clicks,
          impressions: imp,
          ctr,
          position: Number(curPos.toFixed(1))
        });
      });
    });
  }

  return metrics;
}

export const initialInsights: Insight[] = [
  {
    id: 'ins-1',
    websiteId: 'site-acme',
    type: 'traffic_decline',
    severity: 'critical',
    title: 'Severe 48% organic traffic decline on /blog/async-communication-guide',
    description: 'This high-intent pillar post lost 2,140 sessions over the past 28 days. Google Search Console shows ranking drop for "asynchronous team communication best practices" from position 3.1 to 8.2.',
    relatedPageUrl: 'https://acmesoftware.io/blog/async-communication-guide',
    relatedKeyword: 'asynchronous team communication best practices',
    metricContext: {
      previousSessions: 4420,
      currentSessions: 2280,
      dropPercentage: 48.4,
      clickLoss: 480,
      mainLosingQuery: 'asynchronous team communication best practices'
    },
    status: 'active',
    createdAt: '2026-08-20T08:00:00Z'
  },
  {
    id: 'ins-2',
    websiteId: 'site-acme',
    type: 'ranking_drop',
    severity: 'high',
    title: 'Core commercial keyword "cloud kanban board tool" dropped from page 1 (#6 to #12)',
    description: 'Rank dropped 6 positions on desktop US search. Resulting in an estimated loss of 620 monthly organic visitors to /features/kanban.',
    relatedPageUrl: 'https://acmesoftware.io/features/kanban',
    relatedKeyword: 'cloud kanban board tool',
    metricContext: {
      previousRank: 6,
      currentRank: 12,
      rankChange: -6,
      targetUrl: 'https://acmesoftware.io/features/kanban'
    },
    status: 'active',
    createdAt: '2026-08-19T10:00:00Z'
  },
  {
    id: 'ins-3',
    websiteId: 'site-acme',
    type: 'ctr_opportunity',
    severity: 'medium',
    title: 'High-impression CTR opportunity on /vs/trello (1,800 impressions, 3.8% CTR)',
    description: 'Query "trello alternative for product teams" is ranking on position 3.8 with 1,800 impressions but CTR is below top 3 benchmark (8.5%). Updating the title tag and meta description could yield +85 monthly clicks.',
    relatedPageUrl: 'https://acmesoftware.io/vs/trello',
    relatedKeyword: 'trello alternative for product teams',
    metricContext: {
      impressions: 1800,
      ctr: 0.038,
      benchmarkCtr: 0.085,
      position: 3.8
    },
    status: 'active',
    createdAt: '2026-08-18T14:30:00Z'
  },
  {
    id: 'ins-4',
    websiteId: 'site-acme',
    type: 'keyword_win',
    severity: 'info',
    title: 'Ranking breakthrough: "team collaboration software" entered Top 5 (#4)',
    description: 'Target page /features/collaboration gained +3 positions this week, driving +34% organic search clicks.',
    relatedPageUrl: 'https://acmesoftware.io/features/collaboration',
    relatedKeyword: 'team collaboration software',
    metricContext: {
      previousRank: 7,
      currentRank: 4,
      rankChange: 3
    },
    status: 'active',
    createdAt: '2026-08-20T09:15:00Z'
  },
  {
    id: 'ins-5',
    websiteId: 'site-acme',
    type: 'content_decay',
    severity: 'high',
    title: 'Content decay detected on /blog/sprint-planning-template (-52% traffic)',
    description: 'Article has not been updated in 14 months and has lost ranking across 4 major Scrum template queries. Competitors added downloadable Notion & Figma templates.',
    relatedPageUrl: 'https://acmesoftware.io/blog/sprint-planning-template',
    relatedKeyword: 'remote sprint planning templates',
    metricContext: {
      trafficLoss: 1450,
      lastUpdatedMonthsAgo: 14
    },
    status: 'active',
    createdAt: '2026-08-17T11:00:00Z'
  }
];

export const initialActivities: Activity[] = [
  {
    id: 'act-1',
    websiteId: 'site-acme',
    title: 'Refresh & expand /blog/async-communication-guide with 2026 workflows',
    description: 'Update content to address current remote work tools, add practical async protocol templates, update schema markup, and build internal links from top features pages.',
    type: 'content_refresh',
    priority: 'critical',
    effort: 'medium',
    impact: 'critical',
    relatedPageUrl: 'https://acmesoftware.io/blog/async-communication-guide',
    relatedKeyword: 'asynchronous team communication best practices',
    month: '2026-08',
    status: 'in_progress',
    assignedUser: 'Lead Content Strategist',
    dueDate: '2026-08-28',
    plannedDate: '2026-08-15',
    startedDate: '2026-08-20',
    notes: 'Drafting section on AI-assisted async meeting summaries. Internal links placed on /features/collaboration.',
    sourceInsightId: 'ins-1',
    createdAt: '2026-08-15T08:30:00Z'
  },
  {
    id: 'act-2',
    websiteId: 'site-acme',
    title: 'Optimize Title tag & Hero copy for /features/kanban to reclaim #6 rank',
    description: 'Target query "cloud kanban board tool". Revise H1 to include cloud kanban board, add interactive screenshot interactive demo widget, and speed up LCP asset.',
    type: 'title_meta_improvement',
    priority: 'high',
    effort: 'low',
    impact: 'high',
    relatedPageUrl: 'https://acmesoftware.io/features/kanban',
    relatedKeyword: 'cloud kanban board tool',
    month: '2026-08',
    status: 'approved',
    assignedUser: 'SEO Lead',
    dueDate: '2026-08-30',
    plannedDate: '2026-08-19',
    notes: 'Proposed Title: "Cloud Kanban Board Tool for Fast Teams | Acme"',
    sourceInsightId: 'ins-2',
    createdAt: '2026-08-19T10:30:00Z'
  },
  {
    id: 'act-3',
    websiteId: 'site-acme',
    title: 'CTR Title & Meta Description optimization for /vs/trello',
    description: 'Test high-CTR action-oriented title: "Acme vs Trello: Why Modern Product Teams Are Switching in 2026". Include pricing comparison callout in snippet.',
    type: 'ctr_optimization',
    priority: 'medium',
    effort: 'low',
    impact: 'medium',
    relatedPageUrl: 'https://acmesoftware.io/vs/trello',
    relatedKeyword: 'trello alternative for product teams',
    month: '2026-08',
    status: 'completed',
    assignedUser: 'Copywriter',
    dueDate: '2026-08-10',
    plannedDate: '2026-08-01',
    startedDate: '2026-08-04',
    completedDate: '2026-08-09',
    notes: 'Deployed new meta description emphasizing 50% lower cost. CTR jumped from 3.8% to 6.2%!',
    sourceInsightId: 'ins-3',
    createdAt: '2026-08-01T15:00:00Z'
  },
  {
    id: 'act-4',
    websiteId: 'site-acme',
    title: 'Create downloadable sprint planning Figma & Notion templates on /blog/sprint-planning-template',
    description: 'Modernize article with embedded preview of free templates to capture backlinks and restore query positions.',
    type: 'content_refresh',
    priority: 'high',
    effort: 'medium',
    impact: 'high',
    relatedPageUrl: 'https://acmesoftware.io/blog/sprint-planning-template',
    relatedKeyword: 'remote sprint planning templates',
    month: '2026-08',
    status: 'approved',
    assignedUser: 'Design + SEO',
    dueDate: '2026-09-10',
    plannedDate: '2026-08-17',
    sourceInsightId: 'ins-5',
    createdAt: '2026-08-17T11:30:00Z'
  },
  {
    id: 'act-5',
    websiteId: 'site-acme',
    title: 'Internal linking campaign: Link from top 10 blog posts to /features/collaboration',
    description: 'Audit contextual anchor texts across engineering and remote work articles to boost authority for the "team collaboration software" keyword.',
    type: 'internal_linking',
    priority: 'high',
    effort: 'low',
    impact: 'high',
    relatedPageUrl: 'https://acmesoftware.io/features/collaboration',
    relatedKeyword: 'team collaboration software',
    month: '2026-07',
    status: 'completed',
    assignedUser: 'SEO Specialist',
    dueDate: '2026-07-25',
    plannedDate: '2026-07-10',
    startedDate: '2026-07-16',
    completedDate: '2026-07-24',
    notes: 'Added 14 high-quality contextual links. Resulted in rank jumping from #9 to #4!',
    createdAt: '2026-07-10T09:00:00Z'
  },
  {
    id: 'act-5b',
    websiteId: 'site-acme',
    title: 'Page Speed & Hero CTA optimization on /features/collaboration',
    description: 'Compress webp demo media and test dual primary CTA buttons above the fold.',
    type: 'conversion_optimization',
    priority: 'medium',
    effort: 'low',
    impact: 'high',
    relatedPageUrl: 'https://acmesoftware.io/features/collaboration',
    relatedKeyword: 'team collaboration software',
    month: '2026-08',
    status: 'completed',
    assignedUser: 'Frontend Lead',
    dueDate: '2026-08-12',
    plannedDate: '2026-08-02',
    startedDate: '2026-08-08',
    completedDate: '2026-08-12',
    notes: 'LCP dropped from 2.8s to 1.1s. Conversion rate increased by +18%.',
    createdAt: '2026-08-02T10:00:00Z'
  },
  {
    id: 'act-6',
    websiteId: 'site-acme',
    title: 'Technical schema audit: Add SoftwareApplication structured data to all feature pages',
    description: 'Implement JSON-LD SoftwareApplication schema with pricing, ratings, and operating system attributes.',
    type: 'technical_review',
    priority: 'medium',
    effort: 'low',
    impact: 'medium',
    relatedPageUrl: 'https://acmesoftware.io/features/kanban',
    month: '2026-07',
    status: 'completed',
    assignedUser: 'Dev Lead',
    dueDate: '2026-07-20',
    plannedDate: '2026-07-05',
    startedDate: '2026-07-12',
    completedDate: '2026-07-19',
    notes: 'Validated with Google Rich Results test. No errors.',
    createdAt: '2026-07-05T14:00:00Z'
  }
];

export const initialMonthlyReports: MonthlyReport[] = [
  {
    id: 'rep-2026-07-acme',
    websiteId: 'site-acme',
    month: '2026-07',
    title: 'Monthly SEO Performance Report - July 2026',
    createdAt: '2026-08-01T04:00:00Z',
    config: {
      agencyName: 'Apex Growth Studio',
      clientName: 'Acme SaaS Leadership',
      logoUrl: '',
      brandColor: '#0f766e',
      footerText: 'Confidential Performance Audit • Prepared by Sitelift',
      customIntro: 'July demonstrated strong gains in bottom-of-funnel commercial keywords (+3 positions for primary target), balanced by targeted content decay in mid-funnel informational blog posts.',
      manualNotes: 'Strategic priority for August: Execute content refreshes on declining blog assets to recover ~4,000 monthly sessions and defend core rankings.',
      sections: {
        executiveSummary: true,
        trafficOverview: true,
        organicSearch: true,
        topPages: true,
        growingPages: true,
        decliningPages: true,
        categoryPerformance: true,
        brandVsNonBrand: true,
        sourceBreakdown: true,
        keywordMovement: true,
        completedActivities: true,
        nextMonthPlan: true,
        recommendations: true
      },
      topLimit: 5
    },
    snapshotData: {
      executiveSummary: {
        totalSessions: 142850,
        sessionsGrowthMoM: 4.8,
        organicClicks: 89420,
        clicksGrowthMoM: 6.2,
        topKeywordCount: 3,
        completedTasksCount: 2,
        keyHighlight: '"team collaboration software" surged to #4 in Google US, driving record commercial conversions.'
      },
      trafficOverview: {
        totalSessions: 142850,
        previousSessions: 136300,
        organicSessions: 89420,
        engagedSessions: 97138,
        avgEngagementRate: 0.68,
        totalConversions: 4120,
        dailyTrends: [
          { date: '2026-07-01', sessions: 4500, clicks: 2800 },
          { date: '2026-07-08', sessions: 4620, clicks: 2910 },
          { date: '2026-07-15', sessions: 4580, clicks: 2890 },
          { date: '2026-07-22', sessions: 4710, clicks: 3020 },
          { date: '2026-07-31', sessions: 4820, clicks: 3100 }
        ]
      },
      organicSearch: {
        totalClicks: 89420,
        previousClicks: 84200,
        totalImpressions: 1420000,
        previousImpressions: 1350000,
        avgCtr: 0.063,
        avgPosition: 11.4
      },
      topPages: [
        { path: '/features/collaboration', category: 'Features', sessions: 24180, clicks: 16200, changePct: 22.4 },
        { path: '/pricing', category: 'Pricing', sessions: 19840, clicks: 12400, changePct: 5.1 },
        { path: '/vs/trello', category: 'Comparison', sessions: 12710, clicks: 8900, changePct: 8.2 },
        { path: '/blog/async-communication-guide', category: 'Blog', sessions: 11800, clicks: 7100, changePct: -18.5 },
        { path: '/features/kanban', category: 'Features', sessions: 16120, clicks: 10200, changePct: -12.1 }
      ],
      growingPages: [
        { path: '/features/collaboration', category: 'Features', sessionGain: 4420, currentSessions: 24180 },
        { path: '/features/automation', category: 'Features', sessionGain: 2890, currentSessions: 15200 },
        { path: '/vs/trello', category: 'Comparison', sessionGain: 960, currentSessions: 12710 }
      ],
      decliningPages: [
        { path: '/blog/async-communication-guide', category: 'Blog', sessionLoss: 2680, currentSessions: 11800 },
        { path: '/features/kanban', category: 'Features', sessionLoss: 2220, currentSessions: 16120 },
        { path: '/blog/sprint-planning-template', category: 'Blog', sessionLoss: 1450, currentSessions: 8980 }
      ],
      categoryPerformance: [
        { category: 'Features', sessions: 55500, clicks: 36800, sharePct: 38.8 },
        { category: 'Blog', sessions: 48200, clicks: 30100, sharePct: 33.7 },
        { category: 'Pricing', sessions: 19840, clicks: 12400, sharePct: 13.9 },
        { category: 'Comparison', sessions: 12710, clicks: 8900, sharePct: 8.9 },
        { category: 'Documentation', sessions: 6600, clicks: 1220, sharePct: 4.7 }
      ],
      brandVsNonBrand: {
        brandedClicks: 24100,
        nonBrandedClicks: 65320,
        brandedImpressions: 82000,
        nonBrandedImpressions: 1338000
      },
      sourceBreakdown: [
        { source: 'Google Organic', channel: 'Organic Search', sessions: 89420, sharePct: 62.6 },
        { source: 'Direct Navigation', channel: 'Direct', sessions: 31400, sharePct: 22.0 },
        { source: 'Referrals & Reviews', channel: 'Referral', sessions: 14200, sharePct: 9.9 },
        { source: 'Social & Community', channel: 'Social', sessions: 7830, sharePct: 5.5 }
      ],
      keywordSummary: {
        trackedTotal: 7,
        top3Count: 2,
        top10Count: 5,
        improvedCount: 3,
        declinedCount: 2,
        newRankings: 1,
        lostRankings: 0,
        topMovements: [
          { keyword: 'team collaboration software', oldRank: 7, newRank: 4, change: 3 },
          { keyword: 'enterprise workflow automation suite', oldRank: 9, newRank: 5, change: 4 },
          { keyword: 'cloud kanban board tool', oldRank: 6, newRank: 12, change: -6 }
        ]
      },
      completedActivities: [
        { title: 'Internal linking campaign: Link from top 10 blog posts to /features/collaboration', type: 'internal_linking', impact: 'high', completedDate: '2026-07-24' },
        { title: 'Technical schema audit: Add SoftwareApplication structured data to all feature pages', type: 'technical_review', impact: 'medium', completedDate: '2026-07-19' }
      ],
      nextMonthPlan: [
        { title: 'Refresh & expand /blog/async-communication-guide with 2026 workflows', type: 'content_refresh', priority: 'critical', impact: 'critical' },
        { title: 'Optimize Title tag & Hero copy for /features/kanban to reclaim #6 rank', type: 'title_meta_improvement', priority: 'high', impact: 'high' },
        { title: 'CTR Title & Meta Description optimization for /vs/trello', type: 'ctr_optimization', priority: 'medium', impact: 'medium' }
      ],
      recommendations: [
        'Prioritize rewriting the 3 declining pillar blog posts before the next core algorithm update.',
        'Implement automated internal linking modules at the bottom of all category hubs.',
        'Expand product comparison pages targeting emerging competitors in the async collaboration space.'
      ]
    }
  }
];

export const initialGlobalSettings: GlobalSettings = {
  appName: 'Sitelift',
  timezone: 'America/New_York',
  dateFormat: 'YYYY-MM-DD',
  defaultReportDay: 1,
  googleClientId: '394820194820-a8f9d0e2k1j3n4m5.apps.googleusercontent.com',
  googleClientSecret: 'GOCSPX-9f8a7d6e5c4b3a2z1y0x',
  brightDataApiToken: 'bd_tok_9281749102834710293487102934',
  brightDataZone: 'serp_google_desktop_zone',
  brightDataDepthLimit: 100,
  defaultRetentionDaysDailyMetrics: 365,
  defaultRetentionDaysGscQueries: 180,
  defaultRetentionDaysRankSnapshots: 730,
  defaultRetentionDaysSyncLogs: 60,
  storeRawApiResponses: false,
  cronSecretToken: 'sitelift_cron_sec_8f93a0d7b2e1c4',
  emailNotifications: true,
  notificationEmail: 'admin@sitelift.local',
  aiSettings: {
    enabled: false,
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-2.5-flash',
    customEndpoint: '',
    temperature: 0.7
  }
};

export const initialSyncJobs: SyncJob[] = [
  {
    id: 'job-101',
    websiteId: 'site-acme',
    jobType: 'ga4_daily_sync',
    status: 'completed',
    startedAt: '2026-08-21T06:00:00Z',
    endedAt: '2026-08-21T06:02:14Z',
    lastSyncedDate: '2026-08-20',
    attempts: 1,
    recordsProcessed: 142
  },
  {
    id: 'job-102',
    websiteId: 'site-acme',
    jobType: 'gsc_daily_sync',
    status: 'completed',
    startedAt: '2026-08-21T06:05:00Z',
    endedAt: '2026-08-21T06:08:45Z',
    lastSyncedDate: '2026-08-20',
    attempts: 1,
    recordsProcessed: 384
  },
  {
    id: 'job-103',
    websiteId: 'site-acme',
    jobType: 'brightdata_rank_check',
    status: 'completed',
    startedAt: '2026-08-20T03:00:00Z',
    endedAt: '2026-08-20T03:01:20Z',
    lastSyncedDate: '2026-08-20',
    attempts: 1,
    recordsProcessed: 7
  },
  {
    id: 'job-104',
    websiteId: 'site-brew',
    jobType: 'ga4_daily_sync',
    status: 'completed',
    startedAt: '2026-08-21T06:15:00Z',
    endedAt: '2026-08-21T06:16:30Z',
    lastSyncedDate: '2026-08-20',
    attempts: 1,
    recordsProcessed: 98
  }
];

export const initialInstallerState: InstallerState = {
  isInstalled: true,
  installedAt: '2026-08-15T10:00:00Z',
  phpVersion: '8.3.4 (CLI)',
  requirements: {
    phpVersionOk: true,
    pdoMysql: true,
    curl: true,
    openssl: true,
    mbstring: true,
    json: true,
    writableFolders: true
  },
  dbConfig: {
    host: '127.0.0.1',
    port: '3306',
    database: 'sitelift_prod',
    username: 'sitelift_user',
    password: '••••••••••••',
    tablePrefix: 'sl_'
  },
  adminUser: {
    email: 'admin@sitelift.local',
    name: 'Primary Administrator'
  },
  appKey: 'base64:7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0=',
  cronToken: 'sitelift_cron_sec_8f93a0d7b2e1c4'
};
