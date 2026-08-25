import { NavTab } from '../types';

export const TAB_TO_SLUG: Record<NavTab, string> = {
  dashboard: 'dashboard',
  declining_pages: 'declining-pages',
  optimization_pipeline: 'optimization-pipeline',
  all_pages: 'all-pages',
  keywords: 'keywords',
  insights: 'insights',
  activities: 'activities',
  reports: 'reports',
  connections: 'connections',
  websites: 'websites',
  category_rules: 'category-rules',
  sync_logs: 'sync-logs',
  deployment: 'deployment',
  settings: 'settings',
  code_package: 'code-package',
  installer: 'installer',
};

export const SLUG_TO_TAB: Record<string, NavTab> = {
  dashboard: 'dashboard',
  'declining-pages': 'declining_pages',
  'declining_pages': 'declining_pages',
  'optimization-pipeline': 'optimization_pipeline',
  'optimization_pipeline': 'optimization_pipeline',
  'all-pages': 'all_pages',
  'all_pages': 'all_pages',
  keywords: 'keywords',
  insights: 'insights',
  activities: 'activities',
  reports: 'reports',
  connections: 'connections',
  websites: 'websites',
  'category-rules': 'category_rules',
  'category_rules': 'category_rules',
  'sync-logs': 'sync_logs',
  'sync_logs': 'sync_logs',
  deployment: 'deployment',
  'deploy-updates': 'deployment',
  settings: 'settings',
  'code-package': 'code_package',
  'code_package': 'code_package',
  installer: 'installer',
};

/**
 * Extracts the current active tab and optional site ID from browser URL
 * (supports hash routes like `#/declining-pages`, path routes like `/declining-pages`, or query params `?tab=declining-pages`).
 */
export function getCurrentRoute(): { tab: NavTab; siteId?: string } {
  if (typeof window === 'undefined') {
    return { tab: 'dashboard' };
  }

  // 1. Try URL Hash (e.g. `#/keywords?site=site-brew` or `#/keywords`)
  const hash = window.location.hash || '';
  if (hash.startsWith('#/')) {
    const cleanHash = hash.replace(/^#\//, '');
    const [pathPart, queryPart] = cleanHash.split('?');
    const slug = pathPart.replace(/^\/+|\/+$/g, '').toLowerCase();

    let siteId: string | undefined;
    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      siteId = searchParams.get('site') || undefined;
    }

    if (slug && SLUG_TO_TAB[slug]) {
      return { tab: SLUG_TO_TAB[slug], siteId };
    }
  }

  // 2. Try URL Search Params (e.g. `?tab=declining-pages&site=site-acme`)
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab');
  const siteParam = searchParams.get('site') || undefined;

  if (tabParam && SLUG_TO_TAB[tabParam.toLowerCase()]) {
    return { tab: SLUG_TO_TAB[tabParam.toLowerCase()], siteId: siteParam };
  }

  // 3. Try Pathname (e.g. `/declining-pages`)
  const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (pathname && SLUG_TO_TAB[pathname]) {
    return { tab: SLUG_TO_TAB[pathname], siteId: siteParam };
  }

  return { tab: 'dashboard', siteId: siteParam };
}

/**
 * Updates the browser URL to reflect the currently viewed tab and active website.
 * Uses Hash routing to guarantee zero 404 errors on Apache, Nginx, cPanel, and shared hosting.
 */
export function navigateToRoute(tab: NavTab, siteId?: string, replace = false): void {
  if (typeof window === 'undefined') return;

  const slug = TAB_TO_SLUG[tab] || 'dashboard';
  const query = siteId ? `?site=${encodeURIComponent(siteId)}` : '';
  const targetHash = `#/${slug}${query}`;

  if (window.location.hash !== targetHash) {
    if (replace) {
      window.history.replaceState(null, '', targetHash);
    } else {
      window.location.hash = targetHash;
    }
  }
}
