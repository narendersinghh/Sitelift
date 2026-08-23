import { PageMetricDaily, GscQueryMetricDaily, DecliningPageItem, DecliningPriority, PageResearchBreakdown } from '../types';
import { storage } from './storage';

export interface DecliningPagesFilterOptions {
  period: '7d' | '14d' | '28d' | 'last_month' | 'yoy' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  comparisonMode?: 'previous_period' | 'previous_month' | 'yoy' | 'custom';
  comparisonStartDate?: string;
  comparisonEndDate?: string;
  pageCategory?: string;
  keywordCategory?: string;
  brandedFilter?: 'all' | 'branded' | 'non_branded';
  source?: string;
  medium?: string;
  channelGroup?: string;
  country?: string;
  device?: string;
  urlContains?: string;
  minPrevSessions?: number;
  minSessionLoss?: number;
  minDropPct?: number;
  sortBy?: 'priority_score' | 'absolute_loss' | 'drop_pct' | 'current_sessions' | 'previous_sessions';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Matches a string against pattern with given MatchType
 */
export function evaluateRuleMatch(
  value: string,
  pattern: string,
  matchType: 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'exact' | 'glob' | 'query_param'
): boolean {
  if (!value || !pattern) return false;
  const v = value.trim().toLowerCase();
  const p = pattern.trim().toLowerCase();

  switch (matchType) {
    case 'contains':
      return v.includes(p);
    case 'starts_with':
      return v.startsWith(p);
    case 'ends_with':
      return v.endsWith(p);
    case 'exact':
      return v === p;
    case 'glob': {
      try {
        // Convert glob wildcard * to .* and ? to .
        const escaped = p.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\\\*/g, '.*').replace(/\\\?/g, '.');
        return new RegExp(`^${escaped}$`, 'i').test(v);
      } catch {
        return v.includes(p.replace(/\*/g, ''));
      }
    }
    case 'query_param': {
      // Check query parameter match e.g. "category=seo" or "utm_source"
      try {
        if (p.includes('=')) {
          const [key, expectedVal] = p.split('=');
          return v.includes(`${key.trim()}=${expectedVal?.trim()}`);
        }
        return v.includes(`?${p}`) || v.includes(`&${p}`);
      } catch {
        return v.includes(p);
      }
    }
    case 'regex': {
      try {
        return new RegExp(pattern.trim(), 'i').test(value);
      } catch {
        return false;
      }
    }
    default:
      return v.includes(p);
  }
}

/**
 * Evaluates the website's per-property Category Rules to classify any URL path
 */
export function resolvePageCategory(
  cleanPath: string,
  fullUrl: string,
  websiteId: string,
  fallbackCategory: string = 'General'
): string {
  const rules = storage.getCategoryRules(websiteId);
  const activeRules = rules.filter(r => r.isActive !== false).sort((a, b) => a.priority - b.priority);

  for (const r of activeRules) {
    if (r.targetType !== 'url') continue;
    const targetVal = r.pattern.startsWith('http') || r.matchType === 'query_param' ? fullUrl : cleanPath;
    if (evaluateRuleMatch(targetVal, r.pattern, r.matchType)) {
      return r.category || fallbackCategory;
    }
  }

  return fallbackCategory;
}

/**
 * Evaluates the website's per-property Category Rules to classify keywords/queries
 */
export function resolveKeywordCategory(
  keywordOrQuery: string,
  websiteId: string,
  fallbackCategory: string = 'General'
): string {
  const rules = storage.getCategoryRules(websiteId);
  const activeRules = rules.filter(r => r.isActive !== false).sort((a, b) => a.priority - b.priority);

  for (const r of activeRules) {
    if (r.targetType !== 'keyword' && r.targetType !== 'query') continue;
    if (evaluateRuleMatch(keywordOrQuery, r.pattern, r.matchType)) {
      return r.category || fallbackCategory;
    }
  }

  return fallbackCategory;
}

export function computeDecliningPages(
  websiteId: string,
  options: DecliningPagesFilterOptions
): {
  items: DecliningPageItem[];
  summary: {
    totalDecliningPages: number;
    totalTrafficLoss: number;
    avgDropPercentage: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
} {
  const pageMetrics = storage.getPageMetrics(websiteId);
  const gscMetrics = storage.getGscMetrics(websiteId);

  // Determine date ranges
  const maxDateStr = pageMetrics.length > 0 ? pageMetrics.map(m => m.date).sort().reverse()[0] : '2026-08-20';
  const refDate = new Date(maxDateStr);

  let curStartStr: string;
  let curEndStr: string;
  let prevStartStr: string;
  let prevEndStr: string;

  if (options.period === 'custom' && options.customStartDate && options.customEndDate) {
    curStartStr = options.customStartDate;
    curEndStr = options.customEndDate;

    if (options.comparisonStartDate && options.comparisonEndDate) {
      prevStartStr = options.comparisonStartDate;
      prevEndStr = options.comparisonEndDate;
    } else if (options.comparisonMode === 'yoy') {
      const cStart = new Date(options.customStartDate);
      const cEnd = new Date(options.customEndDate);
      cStart.setFullYear(cStart.getFullYear() - 1);
      cEnd.setFullYear(cEnd.getFullYear() - 1);
      prevStartStr = cStart.toISOString().slice(0, 10);
      prevEndStr = cEnd.toISOString().slice(0, 10);
    } else {
      // Default: Previous period with matching day span
      const cStart = new Date(options.customStartDate);
      const cEnd = new Date(options.customEndDate);
      const diffMs = Math.max(24 * 60 * 60 * 1000, cEnd.getTime() - cStart.getTime());
      const pEnd = new Date(cStart.getTime() - 24 * 60 * 60 * 1000);
      const pStart = new Date(pEnd.getTime() - diffMs);
      prevStartStr = pStart.toISOString().slice(0, 10);
      prevEndStr = pEnd.toISOString().slice(0, 10);
    }
  } else if (options.period === 'last_month') {
    // Current Period: Last Full Calendar Month (e.g. July 2026 if refDate is August 2026)
    const refYear = refDate.getFullYear();
    const refMonth = refDate.getMonth(); // 0-indexed (0=Jan, 7=Aug)
    const lastMonthStart = new Date(refYear, refMonth - 1, 1);
    const lastMonthEnd = new Date(refYear, refMonth, 0); // last day of prev month

    curStartStr = lastMonthStart.toISOString().slice(0, 10);
    curEndStr = lastMonthEnd.toISOString().slice(0, 10);

    if (options.comparisonStartDate && options.comparisonEndDate) {
      prevStartStr = options.comparisonStartDate;
      prevEndStr = options.comparisonEndDate;
    } else if (options.comparisonMode === 'yoy') {
      const yoyStart = new Date(refYear - 1, refMonth - 1, 1);
      const yoyEnd = new Date(refYear - 1, refMonth, 0);
      prevStartStr = yoyStart.toISOString().slice(0, 10);
      prevEndStr = yoyEnd.toISOString().slice(0, 10);
    } else {
      // Compare to month prior to last month (e.g. June 2026)
      const prevMonthStart = new Date(refYear, refMonth - 2, 1);
      const prevMonthEnd = new Date(refYear, refMonth - 1, 0);
      prevStartStr = prevMonthStart.toISOString().slice(0, 10);
      prevEndStr = prevMonthEnd.toISOString().slice(0, 10);
    }
  } else {
    let periodDays = 28;
    if (options.period === '7d') periodDays = 7;
    else if (options.period === '14d') periodDays = 14;
    else if (options.period === '28d') periodDays = 28;

    const currentEnd = new Date(refDate);
    const currentStart = new Date(refDate.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000);

    curStartStr = currentStart.toISOString().slice(0, 10);
    curEndStr = currentEnd.toISOString().slice(0, 10);

    if (options.comparisonStartDate && options.comparisonEndDate) {
      prevStartStr = options.comparisonStartDate;
      prevEndStr = options.comparisonEndDate;
    } else if (options.comparisonMode === 'yoy') {
      const yStart = new Date(currentStart);
      const yEnd = new Date(currentEnd);
      yStart.setFullYear(yStart.getFullYear() - 1);
      yEnd.setFullYear(yEnd.getFullYear() - 1);
      prevStartStr = yStart.toISOString().slice(0, 10);
      prevEndStr = yEnd.toISOString().slice(0, 10);
    } else {
      const prevEnd = new Date(currentStart.getTime() - 1 * 24 * 60 * 60 * 1000);
      const prevStart = new Date(prevEnd.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000);
      prevStartStr = prevStart.toISOString().slice(0, 10);
      prevEndStr = prevEnd.toISOString().slice(0, 10);
    }
  }

  const dateRangeLabel = `${curStartStr} to ${curEndStr}`;
  const comparisonPeriodLabel = `${prevStartStr} to ${prevEndStr}`;

  // Filter GA4 metrics
  const pageMap: Record<
    string,
    {
      pagePath: string;
      fullUrl: string;
      category: string;
      curSessions: number;
      prevSessions: number;
      curConversions: number;
      prevConversions: number;
      curEngaged: number;
      prevEngaged: number;
    }
  > = {};

  pageMetrics.forEach(m => {
    // Dynamic category resolution using website's specific category rules
    const dynamicCategory = resolvePageCategory(m.cleanPath || m.pagePath, m.fullUrl, websiteId, m.category || 'General');

    // apply dimension filters
    if (options.pageCategory && options.pageCategory !== 'all' && dynamicCategory !== options.pageCategory) return;
    if (options.source && options.source !== 'all' && m.source !== options.source) return;
    if (options.medium && options.medium !== 'all' && m.medium !== options.medium) return;
    if (options.channelGroup && options.channelGroup !== 'all' && m.channelGroup !== options.channelGroup) return;
    if (options.country && options.country !== 'all' && m.country !== options.country) return;
    if (options.device && options.device !== 'all' && m.device !== options.device) return;
    if (options.urlContains && !m.pagePath.toLowerCase().includes(options.urlContains.toLowerCase())) return;

    if (!pageMap[m.pagePath]) {
      pageMap[m.pagePath] = {
        pagePath: m.pagePath,
        fullUrl: m.fullUrl,
        category: dynamicCategory,
        curSessions: 0,
        prevSessions: 0,
        curConversions: 0,
        prevConversions: 0,
        curEngaged: 0,
        prevEngaged: 0
      };
    }

    if (m.date >= curStartStr && m.date <= curEndStr) {
      pageMap[m.pagePath].curSessions += m.sessions;
      pageMap[m.pagePath].curConversions += m.conversions;
      pageMap[m.pagePath].curEngaged += m.engagedSessions;
    } else if (m.date >= prevStartStr && m.date <= prevEndStr) {
      pageMap[m.pagePath].prevSessions += m.sessions;
      pageMap[m.pagePath].prevConversions += m.conversions;
      pageMap[m.pagePath].prevEngaged += m.engagedSessions;
    }
  });

  // Aggregate GSC query metrics by page and query with brand/non-brand tracking
  const gscPageMap: Record<
    string,
    {
      curClicks: number;
      prevClicks: number;
      curImp: number;
      prevImp: number;
      curBrandClicks: number;
      prevBrandClicks: number;
      curNonBrandClicks: number;
      prevNonBrandClicks: number;
      curBrandImp: number;
      prevBrandImp: number;
      curNonBrandImp: number;
      prevNonBrandImp: number;
      curBrandPositions: number[];
      prevBrandPositions: number[];
      curNonBrandPositions: number[];
      prevNonBrandPositions: number[];
      curPositions: number[];
      prevPositions: number[];
      queries: Record<
        string,
        {
          query: string;
          isBranded: boolean;
          curClicks: number;
          prevClicks: number;
          curImp: number;
          prevImp: number;
          curPos: number[];
          prevPos: number[];
        }
      >;
    }
  > = {};

  gscMetrics.forEach(g => {
    if (options.brandedFilter === 'branded' && !g.isBranded) return;
    if (options.brandedFilter === 'non_branded' && g.isBranded) return;
    if (options.keywordCategory && options.keywordCategory !== 'all' && g.category !== options.keywordCategory) return;
    if (options.country && options.country !== 'all' && g.country !== options.country) return;
    if (options.device && options.device !== 'all' && g.device !== options.device) return;

    const path = g.cleanPath;
    if (!gscPageMap[path]) {
      gscPageMap[path] = {
        curClicks: 0,
        prevClicks: 0,
        curImp: 0,
        prevImp: 0,
        curBrandClicks: 0,
        prevBrandClicks: 0,
        curNonBrandClicks: 0,
        prevNonBrandClicks: 0,
        curBrandImp: 0,
        prevBrandImp: 0,
        curNonBrandImp: 0,
        prevNonBrandImp: 0,
        curBrandPositions: [],
        prevBrandPositions: [],
        curNonBrandPositions: [],
        prevNonBrandPositions: [],
        curPositions: [],
        prevPositions: [],
        queries: {}
      };
    }

    if (!gscPageMap[path].queries[g.query]) {
      gscPageMap[path].queries[g.query] = {
        query: g.query,
        isBranded: g.isBranded,
        curClicks: 0,
        prevClicks: 0,
        curImp: 0,
        prevImp: 0,
        curPos: [],
        prevPos: []
      };
    }

    if (g.date >= curStartStr && g.date <= curEndStr) {
      gscPageMap[path].curClicks += g.clicks;
      gscPageMap[path].curImp += g.impressions;
      gscPageMap[path].curPositions.push(g.position);
      if (g.isBranded) {
        gscPageMap[path].curBrandClicks += g.clicks;
        gscPageMap[path].curBrandImp += g.impressions;
        gscPageMap[path].curBrandPositions.push(g.position);
      } else {
        gscPageMap[path].curNonBrandClicks += g.clicks;
        gscPageMap[path].curNonBrandImp += g.impressions;
        gscPageMap[path].curNonBrandPositions.push(g.position);
      }
      gscPageMap[path].queries[g.query].curClicks += g.clicks;
      gscPageMap[path].queries[g.query].curImp += g.impressions;
      gscPageMap[path].queries[g.query].curPos.push(g.position);
    } else if (g.date >= prevStartStr && g.date <= prevEndStr) {
      gscPageMap[path].prevClicks += g.clicks;
      gscPageMap[path].prevImp += g.impressions;
      gscPageMap[path].prevPositions.push(g.position);
      if (g.isBranded) {
        gscPageMap[path].prevBrandClicks += g.clicks;
        gscPageMap[path].prevBrandImp += g.impressions;
        gscPageMap[path].prevBrandPositions.push(g.position);
      } else {
        gscPageMap[path].prevNonBrandClicks += g.clicks;
        gscPageMap[path].prevNonBrandImp += g.impressions;
        gscPageMap[path].prevNonBrandPositions.push(g.position);
      }
      gscPageMap[path].queries[g.query].prevClicks += g.clicks;
      gscPageMap[path].queries[g.query].prevImp += g.impressions;
      gscPageMap[path].queries[g.query].prevPos.push(g.position);
    }
  });

  const minPrev = options.minPrevSessions ?? 50;
  const minLoss = options.minSessionLoss ?? 20;
  const minDropPct = options.minDropPct ?? 10;

  const items: DecliningPageItem[] = [];

  Object.values(pageMap).forEach(p => {
    if (p.prevSessions < minPrev) return;

    const sessionChange = p.curSessions - p.prevSessions;
    if (sessionChange >= 0) return; // not declining

    const absoluteLoss = Math.abs(sessionChange);
    const dropPct = Number(((absoluteLoss / p.prevSessions) * 100).toFixed(1));

    if (absoluteLoss < minLoss || dropPct < minDropPct) return;

    const gscData = gscPageMap[p.pagePath] || {
      curClicks: 0,
      prevClicks: 0,
      curImp: 0,
      prevImp: 0,
      curBrandClicks: 0,
      prevBrandClicks: 0,
      curNonBrandClicks: 0,
      prevNonBrandClicks: 0,
      curBrandImp: 0,
      prevBrandImp: 0,
      curNonBrandImp: 0,
      prevNonBrandImp: 0,
      curBrandPositions: [],
      prevBrandPositions: [],
      curNonBrandPositions: [],
      prevNonBrandPositions: [],
      curPositions: [],
      prevPositions: [],
      queries: {}
    };

    const curCtr = gscData.curImp > 0 ? Number(((gscData.curClicks / gscData.curImp) * 100).toFixed(2)) : 0;
    const prevCtr = gscData.prevImp > 0 ? Number(((gscData.prevClicks / gscData.prevImp) * 100).toFixed(2)) : 0;

    const curAvgPos =
      gscData.curPositions.length > 0
        ? Number((gscData.curPositions.reduce((a, b) => a + b, 0) / gscData.curPositions.length).toFixed(1))
        : 0;
    const prevAvgPos =
      gscData.prevPositions.length > 0
        ? Number((gscData.prevPositions.reduce((a, b) => a + b, 0) / gscData.prevPositions.length).toFixed(1))
        : 0;

    const convLoss = Math.max(0, p.prevConversions - p.curConversions);

    // Calculate priority score (0 to 100)
    const lossPart = Math.min(100, (absoluteLoss / 50)) * 0.40;
    const dropPctPart = Math.min(100, dropPct) * 0.35;
    const baseVolumePart = Math.min(100, (p.prevSessions / 100)) * 0.15;
    const convPart = Math.min(100, convLoss * 15) * 0.10;

    const rawScore = Math.round(lossPart + dropPctPart + baseVolumePart + convPart);
    const priorityScore = Math.max(1, Math.min(99, rawScore));

    let priorityLevel: DecliningPriority = 'low';
    if (priorityScore >= 70) priorityLevel = 'critical';
    else if (priorityScore >= 50) priorityLevel = 'high';
    else if (priorityScore >= 30) priorityLevel = 'medium';

    // Top losing queries
    const queryList = Object.values(gscData.queries)
      .map(q => {
        const curAvg = q.curPos.length > 0 ? q.curPos.reduce((a, b) => a + b, 0) / q.curPos.length : 0;
        const prevAvg = q.prevPos.length > 0 ? q.prevPos.reduce((a, b) => a + b, 0) / q.prevPos.length : 0;
        const cLoss = q.prevClicks - q.curClicks;
        return {
          query: q.query,
          isBranded: q.isBranded,
          previousClicks: q.prevClicks,
          currentClicks: q.curClicks,
          clickLoss: cLoss,
          previousPosition: Number(prevAvg.toFixed(1)),
          currentPosition: Number(curAvg.toFixed(1))
        };
      })
      .filter(q => q.clickLoss > 0)
      .sort((a, b) => b.clickLoss - a.clickLoss)
      .slice(0, 8);

    // Brand vs Non-Brand Detailed Metrics
    const brandLoss = Math.max(0, gscData.prevBrandClicks - gscData.curBrandClicks);
    const brandLossPct = gscData.prevBrandClicks > 0 ? Number(((brandLoss / gscData.prevBrandClicks) * 100).toFixed(1)) : 0;
    const brandImpLoss = Math.max(0, gscData.prevBrandImp - gscData.curBrandImp);
    const brandImpLossPct = gscData.prevBrandImp > 0 ? Number(((brandImpLoss / gscData.prevBrandImp) * 100).toFixed(1)) : 0;
    const brandCtr = gscData.curBrandImp > 0 ? Number(((gscData.curBrandClicks / gscData.curBrandImp) * 100).toFixed(2)) : 0;
    const prevBrandCtr = gscData.prevBrandImp > 0 ? Number(((gscData.prevBrandClicks / gscData.prevBrandImp) * 100).toFixed(2)) : 0;
    const brandAvgPosition = gscData.curBrandPositions.length > 0 ? Number((gscData.curBrandPositions.reduce((a, b) => a + b, 0) / gscData.curBrandPositions.length).toFixed(1)) : 1.2;
    const prevBrandAvgPosition = gscData.prevBrandPositions.length > 0 ? Number((gscData.prevBrandPositions.reduce((a, b) => a + b, 0) / gscData.prevBrandPositions.length).toFixed(1)) : 1.1;
    const brandQueriesCount = Object.values(gscData.queries).filter(q => q.isBranded).length;

    const nonBrandLoss = Math.max(0, gscData.prevNonBrandClicks - gscData.curNonBrandClicks);
    const nonBrandLossPct = gscData.prevNonBrandClicks > 0 ? Number(((nonBrandLoss / gscData.prevNonBrandClicks) * 100).toFixed(1)) : 0;
    const nonBrandImpLoss = Math.max(0, gscData.prevNonBrandImp - gscData.curNonBrandImp);
    const nonBrandImpLossPct = gscData.prevNonBrandImp > 0 ? Number(((nonBrandImpLoss / gscData.prevNonBrandImp) * 100).toFixed(1)) : 0;
    const nonBrandCtr = gscData.curNonBrandImp > 0 ? Number(((gscData.curNonBrandClicks / gscData.curNonBrandImp) * 100).toFixed(2)) : 0;
    const prevNonBrandCtr = gscData.prevNonBrandImp > 0 ? Number(((gscData.prevNonBrandClicks / gscData.prevNonBrandImp) * 100).toFixed(2)) : 0;
    const nonBrandAvgPosition = gscData.curNonBrandPositions.length > 0 ? Number((gscData.curNonBrandPositions.reduce((a, b) => a + b, 0) / gscData.curNonBrandPositions.length).toFixed(1)) : (curAvgPos || 8.4);
    const prevNonBrandAvgPosition = gscData.prevNonBrandPositions.length > 0 ? Number((gscData.prevNonBrandPositions.reduce((a, b) => a + b, 0) / gscData.prevNonBrandPositions.length).toFixed(1)) : (prevAvgPos || 5.2);
    const nonBrandQueriesCount = Object.values(gscData.queries).filter(q => !q.isBranded).length;

    // CTR vs Impression vs Position Matrix Diagnosis
    const ctrChangeRatio = prevCtr > 0 ? curCtr / prevCtr : 1;
    const impChangeRatio = gscData.prevImp > 0 ? gscData.curImp / gscData.prevImp : 1;
    const posDropDelta = curAvgPos - prevAvgPos;

    let ctrStatus: 'severe_drop' | 'mild_drop' | 'stable' | 'improved' = 'stable';
    if (ctrChangeRatio < 0.70) ctrStatus = 'severe_drop';
    else if (ctrChangeRatio < 0.90) ctrStatus = 'mild_drop';
    else if (ctrChangeRatio > 1.05) ctrStatus = 'improved';

    let impressionsStatus: 'severe_drop' | 'mild_drop' | 'stable' | 'improved' = 'stable';
    if (impChangeRatio < 0.70) impressionsStatus = 'severe_drop';
    else if (impChangeRatio < 0.90) impressionsStatus = 'mild_drop';
    else if (impChangeRatio > 1.05) impressionsStatus = 'improved';

    let rankingStatus: 'severe_drop' | 'mild_drop' | 'stable' | 'improved' = 'stable';
    if (posDropDelta > 3.0) rankingStatus = 'severe_drop';
    else if (posDropDelta > 1.0) rankingStatus = 'mild_drop';
    else if (posDropDelta < -0.5) rankingStatus = 'improved';

    let primaryFactor: 'ctr_collapse' | 'impression_decay' | 'ranking_drop' | 'mixed_decay' = 'mixed_decay';
    let primaryFactorLabel = 'Multi-Factor Organic Erosion';
    let factorExplanation = 'Traffic drop is distributed across position drift, impressions, and click-through friction.';

    if (ctrStatus === 'severe_drop' && (impressionsStatus === 'stable' || impressionsStatus === 'improved')) {
      primaryFactor = 'ctr_collapse';
      primaryFactorLabel = 'CTR Degradation / SERP Snippet Decay';
      factorExplanation = 'Search impressions remained stable, but organic click-through rate dropped sharply. Likely caused by Google AI Overviews, unappealing meta snippet, or date badge staleness.';
    } else if (rankingStatus === 'severe_drop' || (posDropDelta > 2 && impChangeRatio < 0.8)) {
      primaryFactor = 'ranking_drop';
      primaryFactorLabel = 'Keyword Position & Ranking Fall';
      factorExplanation = `Average ranking slipped from #${prevAvgPos || '—'} to #${curAvgPos || '—'}. Competitor content updates or algorithmic re-evaluation displaced this page from top-3 positions.`;
    } else if (impressionsStatus === 'severe_drop' && ctrStatus !== 'severe_drop') {
      primaryFactor = 'impression_decay';
      primaryFactorLabel = 'Impression & Search Demand Loss';
      factorExplanation = 'Search query impressions dropped significantly. Indicates topic seasonality, loss of long-tail keyword visibility, or search intent shifting to alternative queries.';
    }

    // Dynamic SERP Feature displacement tags
    const serpFeatureShifts: string[] = [];
    if (primaryFactor === 'ctr_collapse') {
      serpFeatureShifts.push('AI Overview (SGE) Introduced Above Organic', 'Expanded PAA Accordions', 'Snippet Date Badge Aged');
    } else if (primaryFactor === 'ranking_drop') {
      serpFeatureShifts.push('Competitor New Comparison Guides', 'Reddit / UGC Discussions Ranked Higher', 'Featured Snippet Lost');
    } else {
      serpFeatureShifts.push('Search Demand Migration', 'Video Pack Insertion');
    }

    // Remediation Roadmap
    const actionPlan = [
      {
        title: 'Title Tag & Hook Optimization',
        category: 'CTR Optimization',
        priority: (primaryFactor === 'ctr_collapse' ? 'critical' : 'high') as 'critical' | 'high' | 'medium',
        action: `Update <title> and meta description for ${p.pagePath}. Include updated value proposition and target lost query "${queryList[0]?.query || 'core keyword'}".`
      },
      {
        title: 'Content Depth & Freshness Audit',
        category: 'Content Refresh',
        priority: (primaryFactor === 'ranking_drop' ? 'critical' : 'high') as 'critical' | 'high' | 'medium',
        action: `Expand core sections addressing search intent for "${queryList.map(q => q.query).slice(0, 2).join(' & ')}". Add structured comparison tables and FAQ schema.`
      },
      {
        title: 'Internal Linking Boost',
        category: 'Technical & Architecture',
        priority: 'medium' as 'critical' | 'high' | 'medium',
        action: `Add 3-5 contextual internal links from high-authority parent pages to ${p.pagePath} using exact/partial anchor variations.`
      }
    ];

    // Suggested action logic
    let suggestedAction = 'Review search intent and update main sections';
    if (primaryFactor === 'ctr_collapse') {
      suggestedAction = 'CTR drop detected: Revamp meta title, test emotional hook & structured data';
    } else if (dropPct > 45 && queryList.length > 0) {
      suggestedAction = `Pillar refresh: Recover lost rankings on "${queryList[0].query}"`;
    } else if (prevAvgPos > 0 && curAvgPos > prevAvgPos + 3) {
      suggestedAction = 'Re-optimize Title tag, H1 & schema to regain ranking';
    } else if (p.category === 'Features' || p.category === 'Pricing') {
      suggestedAction = 'High-value commercial page: Audit intent & internal links immediately';
    }

    const research: PageResearchBreakdown = {
      brandClicks: gscData.curBrandClicks,
      prevBrandClicks: gscData.prevBrandClicks,
      brandLoss,
      brandLossPct,
      brandImpressions: gscData.curBrandImp,
      prevBrandImpressions: gscData.prevBrandImp,
      brandImpLoss,
      brandImpLossPct,
      brandCtr,
      prevBrandCtr,
      brandAvgPosition,
      prevBrandAvgPosition,
      brandQueriesCount,

      nonBrandClicks: gscData.curNonBrandClicks,
      prevNonBrandClicks: gscData.prevNonBrandClicks,
      nonBrandLoss,
      nonBrandLossPct,
      nonBrandImpressions: gscData.curNonBrandImp,
      prevNonBrandImpressions: gscData.prevNonBrandImp,
      nonBrandImpLoss,
      nonBrandImpLossPct,
      nonBrandCtr,
      prevNonBrandCtr,
      nonBrandAvgPosition,
      prevNonBrandAvgPosition,
      nonBrandQueriesCount,

      isBrandDeclining: brandLossPct > 15,
      isNonBrandDeclining: nonBrandLossPct > 10,
      ctrStatus,
      impressionsStatus,
      rankingStatus,
      primaryFactor,
      primaryFactorLabel,
      factorExplanation,
      serpFeatureShifts,
      actionPlan
    };

    items.push({
      pageUrl: p.fullUrl,
      cleanPath: p.pagePath,
      pageCategory: p.category,
      currentSessions: p.curSessions,
      previousSessions: p.prevSessions,
      sessionChange,
      absoluteLoss,
      dropPercentage: dropPct,
      currentClicks: gscData.curClicks,
      previousClicks: gscData.prevClicks,
      clickChange: gscData.curClicks - gscData.prevClicks,
      currentImpressions: gscData.curImp,
      previousImpressions: gscData.prevImp,
      currentCtr: curCtr,
      previousCtr: prevCtr,
      currentAvgPosition: curAvgPos,
      previousAvgPosition: prevAvgPos,
      conversionsLoss: convLoss,
      priorityScore,
      priorityLevel,
      suggestedAction,
      topLosingQueries: queryList,
      research,
      dateRangeLabel,
      comparisonPeriodLabel
    });
  });

  // Sort items
  const sortBy = options.sortBy || 'priority_score';
  const sortDir = options.sortDirection || 'desc';

  items.sort((a, b) => {
    let valA = 0;
    let valB = 0;
    if (sortBy === 'priority_score') {
      valA = a.priorityScore;
      valB = b.priorityScore;
    } else if (sortBy === 'absolute_loss') {
      valA = a.absoluteLoss;
      valB = b.absoluteLoss;
    } else if (sortBy === 'drop_pct') {
      valA = a.dropPercentage;
      valB = b.dropPercentage;
    } else if (sortBy === 'current_sessions') {
      valA = a.currentSessions;
      valB = b.currentSessions;
    } else if (sortBy === 'previous_sessions') {
      valA = a.previousSessions;
      valB = b.previousSessions;
    }

    return sortDir === 'asc' ? valA - valB : valB - valA;
  });

  const totalTrafficLoss = items.reduce((acc, curr) => acc + curr.absoluteLoss, 0);
  const avgDropPercentage =
    items.length > 0 ? Number((items.reduce((acc, curr) => acc + curr.dropPercentage, 0) / items.length).toFixed(1)) : 0;

  const summary = {
    totalDecliningPages: items.length,
    totalTrafficLoss,
    avgDropPercentage,
    criticalCount: items.filter(i => i.priorityLevel === 'critical').length,
    highCount: items.filter(i => i.priorityLevel === 'high').length,
    mediumCount: items.filter(i => i.priorityLevel === 'medium').length,
    lowCount: items.filter(i => i.priorityLevel === 'low').length,
    dateRangeLabel,
    comparisonPeriodLabel,
    curStartStr,
    curEndStr,
    prevStartStr,
    prevEndStr
  };

  return { items, summary };
}
