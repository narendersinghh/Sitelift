import { Website, Activity, DecliningPageItem, Keyword, Insight, MonthlyReport } from '../types';
import { storage } from './storage';

export interface AiTaskGenerationParams {
  website: Website;
  monthStr: string;
  decliningPages: DecliningPageItem[];
  keywords: Keyword[];
  insights: Insight[];
}

export interface AiReportSummaryParams {
  website: Website;
  monthStr: string;
  metrics: {
    totalSessions: number;
    organicSessions: number;
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    topDecliningPages: { path: string; loss: number }[];
    topLosingKeywords: { keyword: string; oldRank: number; newRank: number }[];
    completedTasksCount: number;
  };
}

/**
 * Executes AI API requests for Activity Planner task generation and Report narratives.
 * Raw metrics, positions, and logs remain 100% computed from GA4, GSC, and Bright Data APIs.
 */
export class AiService {
  /**
   * Generates AI-assisted Action Items for the Monthly Activity Board based on real GA4/GSC decline data.
   */
  public async generateTasks(params: AiTaskGenerationParams): Promise<Activity[]> {
    const settings = storage.getSettings();
    const aiConfig = settings.aiSettings;

    // If AI is not configured or disabled, return null so caller uses deterministic rules
    if (!aiConfig || !aiConfig.enabled || !aiConfig.apiKey.trim()) {
      return [];
    }

    const { website, monthStr, decliningPages, keywords, insights } = params;

    const criticalPages = decliningPages.slice(0, 4).map(p => ({
      path: p.cleanPath,
      loss: p.absoluteLoss,
      dropPct: p.dropPercentage,
      topLosingQueries: p.topLosingQueries.slice(0, 2).map(q => q.query)
    }));

    const droppedKeywords = keywords
      .filter(k => k.currentRank && k.previousRank && k.currentRank > k.previousRank)
      .slice(0, 4)
      .map(k => ({
        keyword: k.keyword,
        currentRank: k.currentRank,
        previousRank: k.previousRank,
        targetUrl: k.targetUrl
      }));

    const activeInsights = insights.slice(0, 3).map(i => ({
      title: i.title,
      severity: i.severity
    }));

    const prompt = `You are a Senior Technical SEO Strategist for ${website.name} (${website.domain}).
Based on REAL verified data:
- Top Declining URLs: ${JSON.stringify(criticalPages)}
- Tracked Keywords with SERP Drops: ${JSON.stringify(droppedKeywords)}
- High Severity Insights: ${JSON.stringify(activeInsights)}

Generate exactly 3 to 4 actionable, high-impact SEO activities for ${monthStr}.
Respond in strict JSON format:
[
  {
    "title": "Specific action title",
    "description": "Clear step-by-step technical or content strategy to recover lost clicks",
    "type": "content_refresh" | "title_meta_improvement" | "internal_linking" | "ctr_optimization" | "technical_review",
    "priority": "critical" | "high" | "medium",
    "effort": "low" | "medium" | "high",
    "impact": "high" | "critical",
    "relatedPageUrl": "relative path or url",
    "relatedKeyword": "target keyword"
  }
]`;

    try {
      let responseText = '';

      if (aiConfig.provider === 'gemini') {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model || 'gemini-2.5-flash'}:generateContent?key=${aiConfig.apiKey.trim()}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: aiConfig.temperature || 0.7,
              responseMimeType: 'application/json'
            }
          })
        });

        if (!res.ok) throw new Error(`Gemini API returned status ${res.status}`);
        const data = await res.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else if (aiConfig.provider === 'openai' || aiConfig.provider === 'custom') {
        const endpoint = aiConfig.customEndpoint?.trim() || 'https://api.openai.com/v1/chat/completions';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.apiKey.trim()}`
          },
          body: JSON.stringify({
            model: aiConfig.model || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are an expert SEO strategist. Output only JSON array.' },
              { role: 'user', content: prompt }
            ],
            temperature: aiConfig.temperature || 0.7
          })
        });

        if (!res.ok) throw new Error(`OpenAI API returned status ${res.status}`);
        const data = await res.json();
        responseText = data.choices?.[0]?.message?.content || '';
      }

      // Parse JSON output
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => ({
          id: `act-ai-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          websiteId: website.id,
          title: item.title,
          description: item.description,
          type: item.type || 'content_refresh',
          priority: item.priority || 'high',
          effort: item.effort || 'medium',
          impact: item.impact || 'high',
          relatedPageUrl: item.relatedPageUrl ? (item.relatedPageUrl.startsWith('http') ? item.relatedPageUrl : `https://${website.domain}${item.relatedPageUrl}`) : undefined,
          relatedKeyword: item.relatedKeyword,
          month: monthStr,
          status: 'approved',
          assignedUser: 'AI SEO Assistant',
          dueDate: `${monthStr}-25`,
          notes: 'Synthesized via AI Engine using real GA4/GSC drop metrics.',
          createdAt: new Date().toISOString()
        }));
      }
    } catch (err) {
      console.warn('AI task generation failed, falling back to deterministic engine:', err);
    }

    return [];
  }

  /**
   * Generates AI-drafted executive summary and strategic recommendations for Monthly Reports.
   */
  public async generateReportNarrative(params: AiReportSummaryParams): Promise<{
    executiveSummary: string;
    recommendations: string[];
  } | null> {
    const settings = storage.getSettings();
    const aiConfig = settings.aiSettings;

    if (!aiConfig || !aiConfig.enabled || !aiConfig.apiKey.trim()) {
      return null;
    }

    const { website, monthStr, metrics } = params;

    const prompt = `You are an SEO Director writing the Executive Summary for ${website.name} for ${monthStr}.
Key Verified Metrics:
- Total GA4 Sessions: ${metrics.totalSessions.toLocaleString()} (Organic: ${metrics.organicSessions.toLocaleString()})
- GSC Organic Clicks: ${metrics.totalClicks.toLocaleString()} across ${metrics.totalImpressions.toLocaleString()} impressions (Avg CTR: ${metrics.avgCtr}%)
- Critical Declining URLs: ${metrics.topDecliningPages.map(p => `${p.path} (-${p.loss} sessions)`).join(', ') || 'None'}
- Top Dropped Keywords: ${metrics.topLosingKeywords.map(k => `${k.keyword} (#${k.oldRank} -> #${k.newRank})`).join(', ') || 'None'}
- Completed Tasks in Month: ${metrics.completedTasksCount}

Provide a concise, professional 2-3 paragraph executive summary and 3 strategic recommendations.
Respond in strict JSON format:
{
  "executiveSummary": "Paragraph 1 explaining overall traffic health and organic search momentum. Paragraph 2 detailing root causes of observed page declines and SERP movements. Paragraph 3 summarizing tactical execution.",
  "recommendations": [
    "Recommendation 1 with specific target",
    "Recommendation 2 with specific target",
    "Recommendation 3 with specific target"
  ]
}`;

    try {
      let responseText = '';

      if (aiConfig.provider === 'gemini') {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model || 'gemini-2.5-flash'}:generateContent?key=${aiConfig.apiKey.trim()}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: aiConfig.temperature || 0.7,
              responseMimeType: 'application/json'
            }
          })
        });

        if (!res.ok) throw new Error(`Gemini API returned status ${res.status}`);
        const data = await res.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else if (aiConfig.provider === 'openai' || aiConfig.provider === 'custom') {
        const endpoint = aiConfig.customEndpoint?.trim() || 'https://api.openai.com/v1/chat/completions';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.apiKey.trim()}`
          },
          body: JSON.stringify({
            model: aiConfig.model || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are an executive SEO reporting agent. Output only JSON object.' },
              { role: 'user', content: prompt }
            ],
            temperature: aiConfig.temperature || 0.7
          })
        });

        if (!res.ok) throw new Error(`OpenAI API returned status ${res.status}`);
        const data = await res.json();
        responseText = data.choices?.[0]?.message?.content || '';
      }

      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.executiveSummary && Array.isArray(parsed.recommendations)) {
        return {
          executiveSummary: parsed.executiveSummary,
          recommendations: parsed.recommendations
        };
      }
    } catch (err) {
      console.warn('AI report narrative generation failed, falling back:', err);
    }

    return null;
  }
}

export const aiService = new AiService();
