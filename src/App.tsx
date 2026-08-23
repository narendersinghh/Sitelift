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
    <div className="h-screen w-screen bg-[#0f172a] text-slate-200 flex font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      
      {/* Frosted Glass Ambient Luminous Glowing Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/15 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed top-[30%] right-[15%] w-[35%] h-[35%] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none z-0"></div>

      {/* Left Side Navigation Panel (Sticky / Locked) */}
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

      {/* Main Content Area - Scrollable Independently */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden z-10 custom-scrollbar">
        
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
            <div className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs font-medium backdrop-blur-xl ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/90 border-rose-500/30 text-rose-300'
            }`}>
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}

        {/* Main View Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
