import React, { useEffect, useState } from 'react';
import { ApiError } from '@statusflow/api-client';
import { apiClient } from '../lib/apiClient';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const UserSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security' | 'preferences' | 'privacy'>('profile');

  // Form States
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [timezone, setTimezone] = useState('Africa/Lagos');
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  useEffect(() => {
    apiClient.getProfile().then((profile) => {
      if (profile.fullName) setFullName(profile.fullName);
      if (profile.companyName) setCompanyName(profile.companyName);
      if (profile.timezone) setTimezone(profile.timezone);
    }).catch(() => undefined);
  }, []);

  // Security States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiClient.saveProfile(fullName, companyName, timezone);
      triggerToast('Profile and organization settings updated successfully!');
    } catch (err) {
      triggerToast(err instanceof ApiError ? err.message : 'Could not save profile changes. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      triggerToast('Error: New password and confirmation do not match.');
      return;
    }
    if (!user?.email) {
      triggerToast('Could not verify your account. Please sign in again.');
      return;
    }
    setChangingPassword(true);
    try {
      // Verify the current password before changing it — supabase.auth.updateUser() would
      // otherwise happily change the password for anyone with an active session, with no
      // check that they actually know the old one.
      const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (reauthError) {
        triggerToast('Current password is incorrect.');
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        triggerToast(updateError.message);
        return;
      }
      triggerToast('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    setExportingData(true);
    try {
      const [scheduled, history, media] = await Promise.all([
        apiClient.listScheduledPosts().catch(() => ({ posts: [] })),
        apiClient.listPostHistory().catch(() => ({ posts: [] })),
        apiClient.listMedia().catch(() => ({ media: [] })),
      ]);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        user: { fullName, companyName, timezone },
        scheduledPosts: scheduled.posts,
        postHistory: history.posts,
        media: media.media,
        exportDate: new Date().toISOString(),
      }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "statusflow_user_data.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerToast('User data archive exported as statusflow_user_data.json');
    } finally {
      setExportingData(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Account & Platform Settings</h2>
          <p className="text-sm text-zinc-400 mt-1">Configure profile details, security, notification preferences, and privacy controls.</p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800 overflow-x-auto">
          {(['profile', 'security', 'preferences', 'privacy'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveSubTab(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                activeSubTab === t ? 'bg-emerald-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium text-center animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Sub-Tab 1: Profile Management */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleProfileSave} className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6 max-w-2xl">
          <h3 className="font-bold text-base text-white border-b border-zinc-800 pb-3">User & Organization Profile</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-400">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400">Company / Brand Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400">Primary Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="UTC">UTC</option>
                <option value="Africa/Lagos">Africa/Lagos (WAT - UTC+1)</option>
                <option value="America/New_York">America/New_York (EST - UTC-5)</option>
                <option value="Europe/London">Europe/London (GMT - UTC+0)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-semibold text-zinc-950 text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60"
          >
            {savingProfile ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      )}

      {/* Sub-Tab 2: Security & Password */}
      {activeSubTab === 'security' && (
        <form onSubmit={handlePasswordChange} className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6 max-w-2xl">
          <h3 className="font-bold text-base text-white border-b border-zinc-800 pb-3">Password & Account Security</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-400">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-semibold text-zinc-950 text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60"
          >
            {changingPassword ? 'Updating...' : 'Update Security Password'}
          </button>
        </form>
      )}

      {/* Sub-Tab 3: Preferences & WhatsApp Management */}
      {activeSubTab === 'preferences' && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6 max-w-2xl">
          <h3 className="font-bold text-base text-white border-b border-zinc-800 pb-3">Notification & WhatsApp Session Controls</h3>
          <p className="text-xs text-zinc-500 -mt-2">
            Per-alert notification preferences aren't available yet — you'll get all WhatsApp disconnection, broadcast-failure, and
            renewal notifications in the Notifications panel until this ships.
          </p>

          <div className="space-y-4 opacity-50 pointer-events-none">
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800">
              <div>
                <div className="text-sm font-semibold text-white">WhatsApp Disconnection Alerts</div>
                <div className="text-xs text-zinc-400">Receive alerts if active WhatsApp Web socket drops.</div>
              </div>
              <input
                type="checkbox"
                checked
                disabled
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800">
              <div>
                <div className="text-sm font-semibold text-white">Status Broadcast Failure Alerts</div>
                <div className="text-xs text-zinc-400">Get notified if a scheduled status fails after 3 worker retries.</div>
              </div>
              <input
                type="checkbox"
                checked
                disabled
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800">
              <div>
                <div className="text-sm font-semibold text-white">Paystack Renewal Reminders</div>
                <div className="text-xs text-zinc-400">Receive reminders prior to subscription auto-renewals.</div>
              </div>
              <input
                type="checkbox"
                checked
                disabled
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Data Export & Danger Zone */}
      {activeSubTab === 'privacy' && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6 max-w-2xl">
          <h3 className="font-bold text-base text-white border-b border-zinc-800 pb-3">Data Portability & Account Privacy</h3>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="text-sm font-semibold text-white">Export Complete Account Data</div>
            <p className="text-xs text-zinc-400">Download a JSON copy of all your profile, schedule, and media metadata.</p>
            <button
              onClick={handleExportData}
              disabled={exportingData}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition-all disabled:opacity-60"
            >
              {exportingData ? 'Preparing export...' : '📥 Download Data Export (JSON)'}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
            <div className="text-sm font-semibold text-red-400">Danger Zone: Delete Account</div>
            <p className="text-xs text-zinc-400">
              Self-service account deletion isn't available yet. To permanently delete your account, WhatsApp session, and
              scheduled statuses, disconnect WhatsApp from the Pairing screen first, then contact an administrator to request
              deletion.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
