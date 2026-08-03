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
  // Sign Out lives in the sidebar, but that's an off-canvas drawer below md — on a phone,
  // a user who never opens the hamburger menu has no visible way to sign out at all. This
  // mirrors it in the header, reachable at every screen size without opening the drawer.
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

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

          <nav className="space-y-5">
            <div className="space-y-1">
              <p className="px-4 mb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Workspace</p>
              <button
                onClick={() => navigate('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                <span className="text-base leading-none">📊</span> Dashboard
              </button>
              <button
                onClick={() => navigate('composer')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'composer' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                <span className="text-base leading-none">✍️</span> Status Composer
              </button>
              <button
                onClick={() => navigate('queue')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'queue' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                <span className="text-base leading-none">⏱️</span> Scheduled Queue
              </button>
              <button
                onClick={() => navigate('calendar')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'calendar' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                <span className="text-base leading-none">📅</span> History & Calendar
              </button>
              <button
                onClick={() => navigate('media')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'media' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                <span className="text-base leading-none">🖼️</span> Media Library
              </button>
            </div>

            <div className="space-y-1">
              <p className="px-4 mb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Connections</p>
              <button
                onClick={() => navigate('pairing')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'pairing' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                <span className="text-base leading-none">💬</span> WhatsApp Pairing
              </button>
              <button
                onClick={() => navigate('notifications')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'notifications' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                <span className="text-base leading-none">🔔</span> Notifications <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500"></span>
              </button>
            </div>

            <div className="space-y-1">
              <p className="px-4 mb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Account</p>
              <button
                onClick={() => navigate('billing')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'billing' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                <span className="text-base leading-none">💳</span> Subscription & Billing
              </button>
              <button
                onClick={() => navigate('referrals')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'referrals' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                <span className="text-base leading-none">🎁</span> Refer & Earn
              </button>
              <button
                onClick={() => navigate('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'settings' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                <span className="text-base leading-none">⚙️</span> Settings
              </button>

              {/* Super Admin Panel Only Visible to abohrandy@gmail.com */}
              {isAdmin && (
                <button
                  onClick={() => navigate('admin')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'admin' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-emerald-400/80 hover:bg-emerald-500/10 hover:text-emerald-400'
                  }`}
                >
                  <span className="text-base leading-none">⭐</span> Admin Panel <span className="ml-auto px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px] font-bold">SUPER</span>
                </button>
              )}
            </div>
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
            <HeaderSocketBadge />
            <div className="relative">

              <button
                onClick={() => setAccountMenuOpen((open) => !open)}
                className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center hover:bg-emerald-500/20 transition-all"
                aria-label="Account menu"
              >
                {(user?.email || 'U')[0].toUpperCase()}
              </button>
              {accountMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setAccountMenuOpen(false)} aria-hidden="true" />
                  <div className="absolute right-0 top-full mt-2 w-56 z-30 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden">
                    <div className="p-3 border-b border-zinc-800">
                      <div className="text-xs text-zinc-500">Signed in as</div>
                      <div className="text-sm text-white font-medium truncate">{user?.email || 'User Account'}</div>
                    </div>
                    <button
                      onClick={() => { setAccountMenuOpen(false); navigate('settings'); }}
                      className="w-full text-left px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/60 transition-all"
                    >
                      ⚙️ Settings
                    </button>
                    <button
                      onClick={signOut}
                      className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all border-t border-zinc-800"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic View Shell — each tab gets its own error boundary (keyed on activeTab,
            so switching tabs remounts a fresh one) so a crash in one page's data/rendering
            can't take down the sidebar with it; every other nav link keeps working. */}
        <div className="p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6">
          <ErrorBoundary key={activeTab} fallback={<TabErrorFallback />}>
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
          </ErrorBoundary>
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

function TabErrorFallback() {
  return (
    <div className="p-8 rounded-2xl bg-zinc-900 border border-red-500/20 text-center space-y-3">
      <div className="w-10 h-10 mx-auto rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-lg font-bold">
        ⚠️
      </div>
      <h2 className="text-sm font-semibold text-white">This section couldn't load</h2>
      <p className="text-xs text-zinc-400 max-w-sm mx-auto">
        Something went wrong rendering this page. The rest of StatusFlow is unaffected — pick another item from the menu, or come back to this one to try again.
      </p>
    </div>
  );
}

function HeaderSocketBadge() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    apiClient
      .whatsappStatus()
      .then((res) => setConnected(res.connected))
      .catch(() => setConnected(false));
  }, []);

  return (
    <div
      className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-2 ${
        connected
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-zinc-800/80 text-zinc-400 border-zinc-700'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
      <span className="hidden sm:inline">{connected ? 'WhatsApp Connected' : 'Waiting for Connection'}</span>
    </div>
  );
}

export default function App() {

  const [page, setPage] = useState<'login' | 'register' | 'forgot-password' | 'onboarding'>('login');

  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainRouter page={page} setPage={setPage} />
      </AuthProvider>
    </ErrorBoundary>

  );
}

function MainRouter({ page, setPage }: any) {
  const { user, loading } = useAuth();
  // `null` = not checked yet (distinct from `false`, so we don't flash the onboarding form
  // before we actually know) — fetched from the profiles table, not kept client-side only,
  // so a returning user who already onboarded isn't asked again every login.
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setOnboarded(null);
      return;
    }
    apiClient
      .getProfile()
      .then((profile) => setOnboarded(profile.onboarded))
      .catch(() => setOnboarded(false));
  }, [user]);

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

  if (onboarded === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-emerald-400 font-semibold">
        Loading StatusFlow...
      </div>
    );
  }

  if (!onboarded) {
    return <Onboarding onComplete={() => setOnboarded(true)} />;
  }

  return <DashboardShell />;
}
