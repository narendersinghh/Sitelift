import { Insight, InsightSeverity } from '../types';
import { storage } from './storage';
import { computeDecliningPages } from './decliningPagesEngine';

export function runInsightEngine(websiteId: string): Insight[] {
  const existingInsights = storage.getInsights(websiteId);
  const keywords = storage.getKeywords(websiteId);
  const { items: decliningPages } = computeDecliningPages(websiteId, { period: '28d' });
  const gscMetrics = storage.getGscMetrics(websiteId);

  const newInsights: Insight[] = [];
  const nowStr = new Date().toISOString();

  // 1. Traffic Decline Insights (from top declining pages)
  decliningPages.slice(0, 3).forEach(dp => {
    const mainLossQuery = dp.topLosingQueries[0]?.query || 'top organic queries';
    newInsights.push({
      id: `ins-gen-dec-${Math.random().toString(36).substr(2, 9)}`,
      websiteId,
      type: 'traffic_decline',
      severity: dp.priorityLevel as InsightSeverity,
      title: `${dp.dropPercentage}% organic traffic decline on ${dp.cleanPath}`,
      description: `Page lost ${dp.absoluteLoss.toLocaleString()} sessions in the last 28 days compared to prior period. GSC shows click degradation especially on "${mainLossQuery}".`,
      relatedPageUrl: dp.pageUrl,
      relatedKeyword: dp.topLosingQueries[0]?.query,
      metricContext: {
        currentSessions: dp.currentSessions,
        previousSessions: dp.previousSessions,
        absoluteLoss: dp.absoluteLoss,
        dropPercentage: dp.dropPercentage,
        priorityScore: dp.priorityScore
      },
      status: 'active',
      createdAt: nowStr
    });
  });

  // 2. Keyword Rank Drop Insights
  keywords.forEach(kw => {
    if (kw.currentRank && kw.previousRank && kw.currentRank > kw.previousRank) {
      const drop = kw.currentRank - kw.previousRank;
      if (drop >= 3 || (kw.previousRank <= 10 && kw.currentRank > 10)) {
        newInsights.push({
          id: `ins-gen-kw-${Math.random().toString(36).substr(2, 9)}`,
          websiteId,
          type: 'ranking_drop',
          severity: kw.priority === 'critical' ? 'critical' : 'high',
          title: `Keyword "${kw.keyword}" dropped ${drop} positions (from #${kw.previousRank} to #${kw.currentRank})`,
          description: `Tracked keyword fell on ${kw.device} in ${kw.country}. Target URL is ${kw.targetUrl}. Priority level: ${kw.priority}.`,
          relatedPageUrl: kw.targetUrl,
          relatedKeyword: kw.keyword,
          metricContext: {
            previousRank: kw.previousRank,
            currentRank: kw.currentRank,
            rankChange: -drop,
            intent: kw.intent
          },
          status: 'active',
          createdAt: nowStr
        });
      }
    } else if (kw.currentRank && kw.previousRank && kw.currentRank < kw.previousRank && kw.currentRank <= 5) {
      // Keyword Win
      newInsights.push({
        id: `ins-gen-win-${Math.random().toString(36).substr(2, 9)}`,
        websiteId,
        type: 'keyword_win',
        severity: 'info',
        title: `Ranking gain: "${kw.keyword}" reached Top 5 position #${kw.currentRank}`,
        description: `Gained +${kw.previousRank - kw.currentRank} positions. Target URL: ${kw.targetUrl}.`,
        relatedPageUrl: kw.targetUrl,
        relatedKeyword: kw.keyword,
        metricContext: {
          currentRank: kw.currentRank,
          previousRank: kw.previousRank,
          gain: kw.previousRank - kw.currentRank
        },
        status: 'active',
        createdAt: nowStr
      });
    }
  });

  // 3. CTR Opportunity Insights (High impressions, position <= 5, CTR < 5%)
  const recentGsc = gscMetrics.slice(0, 300);
  const queryMap: Record<string, { query: string; impressions: number; clicks: number; pos: number[]; url: string }> = {};
  recentGsc.forEach(g => {
    if (!queryMap[g.query]) {
      queryMap[g.query] = { query: g.query, impressions: 0, clicks: 0, pos: [], url: g.pageUrl };
    }
    queryMap[g.query].impressions += g.impressions;
    queryMap[g.query].clicks += g.clicks;
    queryMap[g.query].pos.push(g.position);
  });

  Object.values(queryMap).forEach(q => {
    const avgPos = q.pos.length > 0 ? q.pos.reduce((a, b) => a + b, 0) / q.pos.length : 10;
    const ctr = q.impressions > 0 ? (q.clicks / q.impressions) * 100 : 0;
    if (q.impressions >= 1200 && avgPos <= 5.0 && ctr < 4.5) {
      newInsights.push({
        id: `ins-gen-ctr-${Math.random().toString(36).substr(2, 9)}`,
        websiteId,
        type: 'ctr_opportunity',
        severity: 'medium',
        title: `CTR Opportunity for "${q.query}" (${q.impressions.toLocaleString()} impressions, ${ctr.toFixed(1)}% CTR)`,
        description: `Query ranks at avg position ${avgPos.toFixed(1)} but CTR is below benchmark. A modernized title tag with high-converting modifier could yield significant click lift.`,
        relatedPageUrl: q.url,
        relatedKeyword: q.query,
        metricContext: {
          impressions: q.impressions,
          clicks: q.clicks,
          ctr: Number(ctr.toFixed(2)),
          avgPosition: Number(avgPos.toFixed(1))
        },
        status: 'active',
        createdAt: nowStr
      });
    }
  });

  // Deduplicate against existing by title
  const existingTitles = new Set(existingInsights.map(i => i.title));
  const uniqueNew = newInsights.filter(n => !existingTitles.has(n.title));

  uniqueNew.forEach(n => storage.saveInsight(n));

  return storage.getInsights(websiteId);
}
