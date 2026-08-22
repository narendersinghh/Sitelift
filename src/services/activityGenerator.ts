import { Activity, ActivityType, ActivityStatus, EffortLevel, ImpactLevel, Insight, Website } from '../types';
import { storage } from './storage';
import { computeDecliningPages } from './decliningPagesEngine';
import { aiService } from './aiService';

export async function generateMonthlyActivities(websiteId: string, monthStr: string = '2026-08'): Promise<Activity[]> {
  const existingActivities = storage.getActivities(websiteId);
  const insights = storage.getInsights(websiteId);
  const keywords = storage.getKeywords(websiteId);
  const websites = storage.getWebsites();
  const currentWebsite = websites.find(w => w.id === websiteId) || {
    id: websiteId,
    name: 'Target Website',
    domain: 'example.com',
    brandTerms: ['example'],
    timezone: 'UTC',
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const { items: decliningPages } = computeDecliningPages(websiteId, { period: '28d' });

  // 1. Try generating with AI Engine if configured
  const aiTasks = await aiService.generateTasks({
    website: currentWebsite,
    monthStr,
    decliningPages,
    keywords,
    insights
  });

  if (aiTasks.length > 0) {
    const existingTitles = new Set(existingActivities.map(a => a.title.toLowerCase()));
    const uniqueAi = aiTasks.filter(a => !existingTitles.has(a.title.toLowerCase()));
    uniqueAi.forEach(a => storage.saveActivity(a));
    return storage.getActivities(websiteId);
  }

  // 2. Deterministic rule-based task generation
  const newActivities: Activity[] = [];
  const nowStr = new Date().toISOString();

  // From active critical & high insights
  insights
    .filter(i => i.status === 'active' && (i.severity === 'critical' || i.severity === 'high'))
    .forEach(ins => {
      let actType: ActivityType = 'content_refresh';
      let title = `Refresh content for ${ins.relatedPageUrl || 'target page'}`;
      let description = ins.description;
      let effort: EffortLevel = 'medium';
      let impact: ImpactLevel = ins.severity === 'critical' ? 'critical' : 'high';

      if (ins.type === 'ranking_drop') {
        actType = 'title_meta_improvement';
        title = `Optimize Title, H1 & content depth for query "${ins.relatedKeyword || 'target keyword'}"`;
        description = `Target ranking recovery for ${ins.relatedKeyword}. Add missing semantic subtopics, improve internal link anchor density.`;
        effort = 'low';
      } else if (ins.type === 'traffic_decline') {
        actType = 'content_refresh';
        title = `Pillar refresh & update for ${ins.relatedPageUrl ? ins.relatedPageUrl.replace(/^https?:\/\/[^/]+/, '') : 'page'}`;
        description = `Audit intent drift, modernize examples, add actionable step-by-step checklists or interactive assets.`;
        effort = 'medium';
      } else if (ins.type === 'ctr_opportunity') {
        actType = 'ctr_optimization';
        title = `CTR optimization: Revise snippet & title tag for "${ins.relatedKeyword}"`;
        description = `Test compelling click trigger (year, pricing hook, benefits) to lift CTR above 6%.`;
        effort = 'low';
      }

      newActivities.push({
        id: `act-gen-${Math.random().toString(36).substr(2, 9)}`,
        websiteId,
        title,
        description,
        type: actType,
        priority: ins.severity === 'critical' ? 'critical' : 'high',
        effort,
        impact,
        relatedPageUrl: ins.relatedPageUrl,
        relatedKeyword: ins.relatedKeyword,
        month: monthStr,
        status: 'approved',
        assignedUser: 'SEO Lead',
        dueDate: `${monthStr}-28`,
        sourceInsightId: ins.id,
        createdAt: nowStr
      });
    });

  // From top declining commercial pages
  decliningPages
    .filter(dp => dp.priorityLevel === 'critical' || dp.priorityLevel === 'high')
    .slice(0, 2)
    .forEach(dp => {
      newActivities.push({
        id: `act-gen-dp-${Math.random().toString(36).substr(2, 9)}`,
        websiteId,
        title: `Technical & Internal Linking Audit for ${dp.cleanPath}`,
        description: `Page suffered ${dp.dropPercentage}% drop (-${dp.absoluteLoss} sessions). Check Core Web Vitals, fix internal redirect chains, and place 5 contextual inbound internal links.`,
        type: 'internal_linking',
        priority: 'high',
        effort: 'low',
        impact: 'high',
        relatedPageUrl: dp.pageUrl,
        relatedKeyword: dp.topLosingQueries[0]?.query,
        month: monthStr,
        status: 'approved',
        assignedUser: 'Technical SEO',
        dueDate: `${monthStr}-25`,
        createdAt: nowStr
      });
    });

  // Deduplicate against existing by title
  const existingTitles = new Set(existingActivities.map(a => a.title.toLowerCase()));
  const uniqueNew = newActivities.filter(a => !existingTitles.has(a.title.toLowerCase()));

  uniqueNew.forEach(a => storage.saveActivity(a));

  return storage.getActivities(websiteId);
}
