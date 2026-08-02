import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { apiClient } from './lib/apiClient';
import { RenewalSavingsModal, ExpiryWarningModal } from './components/modals/SmartUpgradePrompts';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Onboarding } from './pages/Onboarding';
import { DashboardOverview } from './components/DashboardOverview';
import { WhatsAppPairing } from './components/WhatsAppPairing';
import { MediaLibrary } from './components/MediaLibrary';
import { StatusComposer } from './components/StatusComposer';
import { ScheduledQueue } from './components/ScheduledQueue';
import { HistoryAndCalendar } from './components/HistoryAndCalendar';
import { NotificationCenter } from './components/NotificationCenter';
import { SubscriptionBilling } from './components/SubscriptionBilling';
import { ReferralDashboard } from './components/ReferralDashboard';
import { UserSettings } from './components/UserSettings';
import { AdminPanel } from './components/AdminPanel';
import { ErrorBoundary } from './components/ErrorBoundary';

function DashboardShell() {
  const { user, isAdmin, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'composer' | 'calendar' | 'notifications' | 'pairing' | 'media' | 'billing' | 'referrals' | 'settings' | 'admin'>('dashboard');
  const [smartPrompt, setSmartPrompt] = useState<'renewalSavings' | 'expiryWarning' | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Shared by every nav button — picking a destination should also close the mobile
  // drawer, otherwise the sidebar stays open covering the content it just navigated to.
  const navigate = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // Checked once per session on load — these are proactive nudges, not reactive to a
  // specific user action, so they can surface regardless of which tab is active.
  useEffect(() => {
    apiClient
      .getSubscription()
      .then(({ smartPrompts }) => {
        if (smartPrompts.renewalSavings) setSmartPrompt('renewalSavings');
        else if (smartPrompts.expiryWarning) setSmartPrompt('expiryWarning');
      })
      .catch(() => {
        // Silent — smart prompts are a nice-to-have, not worth surfacing an error banner for.
      });
  }, []);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Mobile-only backdrop, dismisses the drawer when tapped outside it */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation — an off-canvas drawer below md, a static column at md+ */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-zinc-800 bg-zinc-900 p-6 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:z-auto md:bg-zinc-900/50 md:translate-x-0`}
      >
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-zinc-950 text-xl shadow-lg shadow-emerald-500/20">
                S
              </div>
              <span className="font-bold text-xl tracking-tight text-white">StatusFlow</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 text-zinc-400 hover:text-white"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => navigate('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('composer')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'composer' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              Status Composer
            </button>
            <button
              onClick={() => navigate('calendar')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'calendar' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              History & Calendar
            </button>
            <button
              onClick={() => navigate('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'notifications' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              Notifications <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500"></span>
            </button>
            <button
              onClick={() => navigate('queue')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'queue' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              Scheduled Queue
            </button>
            <button
              onClick={() => navigate('media')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'media' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              Media Library
            </button>
            <button
              onClick={() => navigate('pairing')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pairing' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              WhatsApp Pairing
            </button>
            <button
              onClick={() => navigate('billing')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'billing' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              Subscription & Billing
            </button>
            <button
              onClick={() => navigate('referrals')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'referrals' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              Refer & Earn
            </button>
            <button
              onClick={() => navigate('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              Settings
            </button>

            {/* Super Admin Panel Only Visible to abohrandy@gmail.com */}
            {isAdmin && (
              <button
                onClick={() => navigate('admin')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'admin' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-emerald-400/80 hover:bg-emerald-500/10 hover:text-emerald-400'
                }`}
              >
                Admin Panel ⭐ <span className="ml-auto px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px] font-bold">SUPER</span>
              </button>
            )}
          </nav>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1 flex justify-between">
              <span>Current Account</span>
              {isAdmin && <span className="text-emerald-400 font-bold">Super Admin</span>}
            </div>
            <div className="font-semibold text-emerald-400 text-xs truncate">{user?.email || 'User Account'}</div>
          </div>
          <button
            onClick={signOut}
            className="w-full py-2 bg-zinc-800 hover:bg-red-500/10 hover:text-red-400 text-zinc-400 text-xs rounded-lg transition-all border border-zinc-700"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto min-w-0">
        {/* Top App Bar */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/30 px-4 sm:px-6 md:px-8 flex items-center justify-between gap-3 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/60"
              aria-label="Open menu"
            >
              ☰
            </button>
            <h1 className="text-lg font-semibold text-zinc-100 capitalize truncate">{activeTab} Overview</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              onClick={() => navigate('notifications')}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-all relative"
            >
              🔔
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
            <div className="px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline">WhatsApp Socket Connected</span>
            </div>
          </div>
        </header>

        {/* Dynamic View Shell */}
        <div className="p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6">
          {activeTab === 'dashboard' && <DashboardOverview />}
          {activeTab === 'composer' && <StatusComposer onNavigateToBilling={() => setActiveTab('billing')} />}
          {activeTab === 'calendar' && <HistoryAndCalendar />}
          {activeTab === 'notifications' && <NotificationCenter />}
          {activeTab === 'queue' && <ScheduledQueue />}
          {activeTab === 'pairing' && <WhatsAppPairing />}
          {activeTab === 'media' && <MediaLibrary />}
          {activeTab === 'billing' && <SubscriptionBilling />}
          {activeTab === 'referrals' && <ReferralDashboard />}
          {activeTab === 'settings' && <UserSettings />}
          {activeTab === 'admin' && isAdmin && <AdminPanel />}
        </div>
      </main>

      {smartPrompt === 'renewalSavings' && (
        <RenewalSavingsModal
          onDismiss={() => setSmartPrompt(null)}
          onPrimary={() => {
            setSmartPrompt(null);
            setActiveTab('billing');
          }}
        />
      )}
      {smartPrompt === 'expiryWarning' && (
        <ExpiryWarningModal
          onDismiss={() => setSmartPrompt(null)}
          onPrimary={() => {
            setSmartPrompt(null);
            setActiveTab('billing');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<'login' | 'register' | 'forgot-password' | 'onboarding'>('login');
  const [onboarded, setOnboarded] = useState(false);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainRouter page={page} setPage={setPage} onboarded={onboarded} setOnboarded={setOnboarded} />
      </AuthProvider>
    </ErrorBoundary>

  );
}

function MainRouter({ page, setPage, onboarded, setOnboarded }: any) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-emerald-400 font-semibold">
        Loading StatusFlow...
      </div>
    );
  }

  if (!user) {
    if (page === 'register') return <Register onNavigate={setPage} />;
    if (page === 'forgot-password') return <ForgotPassword onNavigate={setPage} />;
    return <Login onNavigate={setPage} />;
  }

  if (!onboarded) {
    return <Onboarding onComplete={() => setOnboarded(true)} />;
  }

  return <DashboardShell />;
}
