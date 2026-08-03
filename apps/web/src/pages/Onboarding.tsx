import React from 'react';
import { apiClient } from '../lib/apiClient';

export const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [fullName, setFullName] = React.useState('');
  const [businessName, setBusinessName] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.saveProfile(fullName, businessName);
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-2xl flex items-center justify-center mx-auto">
            1
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome to StatusFlow</h1>
          <p className="text-sm text-zinc-400">Complete your profile to customize your scheduling workspace</p>
        </div>

        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-400">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400">Company / Brand Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              placeholder="Acme Inc."
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 font-semibold text-zinc-950 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            {saving ? 'Saving...' : 'Continue to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};
