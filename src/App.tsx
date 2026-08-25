import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { OptimizationPipelineView } from './components/OptimizationPipelineView';
import { DecliningPagesView } from './components/DecliningPagesView';
import { AllPagesView } from './components/AllPagesView';
import { KeywordsView } from './components/KeywordsView';
import { InsightsView } from './components/InsightsView';
import { ActivitiesView } from './components/ActivitiesView';
import { ReportsView } from './components/ReportsView';
import { ConnectionsView } from './components/ConnectionsView';
import { WebsitesView } from './components/WebsitesView';
import { CategoryRulesView } from './components/CategoryRulesView';
import { SyncLogsView } from './components/SyncLogsView';
import { DeploymentView } from './components/DeploymentView';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';
import { PageDetailModal } from './components/PageDetailModal';
import { Website, DecliningPageItem, NavTab } from './types';
import { storage } from './services/storage';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!storage.getAuthUser());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [websites, setWebsites] = useState<Website[]>(() => storage.getWebsites());
  const [activeSiteId, setActiveSiteId] = useState<string>(() => storage.getActiveWebsiteId());
  const [selectedDecliningItem, setSelectedDecliningItem] = useState<DecliningPageItem | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Responsive sidebar states
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sitelift_sidebar_collapsed') === 'true';
  });

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sitelift_sidebar_collapsed', String(next));
      return next;
    });
  };

  const activeWebsite = websites.find(w => w.id === activeSiteId) || websites[0];

  const refreshAllData = () => {
    const list = storage.getWebsites();
    setWebsites(list);
    if (!list.some(w => w.id === activeSiteId) && list.length > 0) {
      setActiveSiteId(list[0].id);
      storage.setActiveWebsiteId(list[0].id);
    }
  };

  const handleSelectWebsite = (id: string) => {
    setActiveSiteId(id);
    storage.setActiveWebsiteId(id);
    refreshAllData();
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLogout = () => {
    storage.logout();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="h-screen w-screen bg-[#f0f5fa] text-slate-800 flex font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      
      {/* Left Side Navigation Panel (Dark sticky sidebar) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        websites={websites}
        activeWebsite={activeWebsite}
        onLogout={handleLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area - Light Blue Theme, Scrollable Independently */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden z-10 custom-scrollbar bg-[#f0f5fa]">
        
        {/* Top Header Bar */}
        <TopHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          websites={websites}
          activeWebsite={activeWebsite}
          onSelectWebsite={handleSelectWebsite}
          onNavigateToTab={setActiveTab}
        />

        {/* Floating Notification Toast */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 border-emerald-700 text-white'
                : 'bg-rose-600 border-rose-700 text-white'
            }`}>
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-white shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}

        {/* Main View Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* If no website exists yet and user is on a website-specific tab */}
          {!activeWebsite && !['websites', 'settings', 'deployment', 'code_package', 'installer'].includes(activeTab) && (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs max-w-xl mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No Website Connected Yet</h3>
                <p className="text-xs text-slate-500 mt-1">
                  You are in clean fresh state. Add your first website property or client project to begin tracking SEO declines and keyword rankings.
                </p>
              </div>
              <div>
                <button
                  onClick={() => setActiveTab('websites')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  Add Website Project Now
                </button>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && activeWebsite && (
            <DashboardView
              website={activeWebsite}
              websites={websites}
              onSelectWebsite={handleSelectWebsite}
              onNavigateToDeclining={() => setActiveTab('declining_pages')}
              onNavigateToKeywords={() => setActiveTab('keywords')}
              onNavigateToActivities={() => setActiveTab('activities')}
              onNavigateToReports={() => setActiveTab('reports')}
              onNavigateToInsights={() => setActiveTab('insights')}
              onNavigateToWebsites={() => setActiveTab('websites')}
              onOpenPageDetail={item => setSelectedDecliningItem(item)}
            />
          )}

          {activeTab === 'optimization_pipeline' && activeWebsite && (
            <OptimizationPipelineView
              website={activeWebsite}
              onOpenPageDetail={item => setSelectedDecliningItem(item)}
              onNavigateToCategoryRules={() => setActiveTab('category_rules')}
              onNavigateToActivities={() => setActiveTab('activities')}
            />
          )}

          {activeTab === 'declining_pages' && activeWebsite && (
            <DecliningPagesView
              website={activeWebsite}
              onOpenPageDetail={item => setSelectedDecliningItem(item)}
            />
          )}

          {activeTab === 'all_pages' && activeWebsite && (
            <AllPagesView
              website={activeWebsite}
              onOpenActivityPlanner={() => setActiveTab('activities')}
            />
          )}

          {activeTab === 'keywords' && activeWebsite && (
            <KeywordsView
              website={activeWebsite}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'insights' && activeWebsite && (
            <InsightsView
              website={activeWebsite}
              onNavigateToActivities={() => setActiveTab('activities')}
            />
          )}

          {activeTab === 'activities' && activeWebsite && (
            <ActivitiesView website={activeWebsite} />
          )}

          {activeTab === 'reports' && activeWebsite && (
            <ReportsView website={activeWebsite} />
          )}

          {activeTab === 'connections' && activeWebsite && (
            <ConnectionsView
              website={activeWebsite}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'websites' && (
            <WebsitesView
              websites={websites}
              activeWebsite={activeWebsite}
              onSelectWebsite={handleSelectWebsite}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'category_rules' && activeWebsite && (
            <CategoryRulesView
              website={activeWebsite}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'sync_logs' && activeWebsite && (
            <SyncLogsView
              website={activeWebsite}
              onRefresh={refreshAllData}
            />
          )}

          {(activeTab === 'deployment' || activeTab === 'code_package' || activeTab === 'installer') && (
            <DeploymentView initialTab={activeTab === 'installer' ? 'installer' : 'package'} />
          )}

          {activeTab === 'settings' && (
            <SettingsView onRefresh={refreshAllData} />
          )}
        </main>

        {/* Declining Page Deep Diagnosis & Action Planning Modal */}
        {selectedDecliningItem && activeWebsite && (
          <PageDetailModal
            item={selectedDecliningItem}
            website={activeWebsite}
            onClose={() => setSelectedDecliningItem(null)}
            onActivityCreated={() => {
              refreshAllData();
              showToast('SEO Activity added to monthly action plan!');
            }}
          />
        )}

      </div>

    </div>
  );
}

export default App;
