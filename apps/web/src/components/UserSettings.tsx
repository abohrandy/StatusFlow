import React, { useState } from 'react';

export const UserSettings: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security' | 'preferences' | 'privacy'>('profile');

  // Form States
  const [fullName, setFullName] = useState('John Doe');
  const [companyName, setCompanyName] = useState('StatusFlow Enterprise');
  const [timezone, setTimezone] = useState('Africa/Lagos');
  const [notifyOnDisconnect, setNotifyOnDisconnect] = useState(true);
  const [notifyOnFailure, setNotifyOnFailure] = useState(true);
  const [notifyOnRenewal, setNotifyOnRenewal] = useState(true);

  // Security States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('Profile and organization settings updated successfully!');
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      triggerToast('Error: New password and confirmation do not match.');
      return;
    }
    triggerToast('Security settings updated! Password changed successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      user: { fullName, companyName, timezone },
      schedulesCount: 14,
      mediaCount: 3,
      exportDate: new Date().toISOString()
    }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "statusflow_user_data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast('User data archive exported as statusflow_user_data.json');
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
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-semibold text-zinc-950 text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            Save Profile Changes
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
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-semibold text-zinc-950 text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            Update Security Password
          </button>
        </form>
      )}

      {/* Sub-Tab 3: Preferences & WhatsApp Management */}
      {activeSubTab === 'preferences' && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6 max-w-2xl">
          <h3 className="font-bold text-base text-white border-b border-zinc-800 pb-3">Notification & WhatsApp Session Controls</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800">
              <div>
                <div className="text-sm font-semibold text-white">WhatsApp Disconnection Alerts</div>
                <div className="text-xs text-zinc-400">Receive alerts if active WhatsApp Web socket drops.</div>
              </div>
              <input
                type="checkbox"
                checked={notifyOnDisconnect}
                onChange={(e) => setNotifyOnDisconnect(e.target.checked)}
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
                checked={notifyOnFailure}
                onChange={(e) => setNotifyOnFailure(e.target.checked)}
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
                checked={notifyOnRenewal}
                onChange={(e) => setNotifyOnRenewal(e.target.checked)}
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
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition-all"
            >
              📥 Download Data Export (JSON)
            </button>
          </div>

          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
            <div className="text-sm font-semibold text-red-400">Danger Zone: Delete Account</div>
            <p className="text-xs text-zinc-400">Permanently remove your account, encrypted WhatsApp session keys, and scheduled statuses.</p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold text-xs rounded-xl transition-all"
            >
              Delete Account & Wiping Data
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Lightbox Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-white">Confirm Permanent Account Deletion</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This action cannot be undone. All your schedules, media assets, encrypted Baileys session keys, and Paystack subscription records will be wiped.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium">
                Cancel
              </button>
              <button onClick={() => { setShowDeleteModal(false); triggerToast('Account deletion request queued.'); }} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-xs">
                Confirm Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
