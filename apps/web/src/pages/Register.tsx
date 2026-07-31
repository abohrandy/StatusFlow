import React from 'react';
import { supabase } from '../lib/supabase';

export const Register: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Captured here (rather than attributed immediately) because signUp may require
    // email confirmation before a session exists — AuthContext attributes it once a
    // session actually becomes available, whether that's now or after confirmation.
    const refCode = new URLSearchParams(window.location.search).get('ref');
    if (refCode) {
      localStorage.setItem('sf_pending_referral_code', refCode.trim().toUpperCase());
    }

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else setMessage('Registration successful! Please check your email inbox to verify your account.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-sm text-zinc-400">Start scheduling WhatsApp Statuses automatically</p>
        </div>

        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 text-center">{error}</div>}
        {message && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400 text-center">{message}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-400">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 font-semibold text-zinc-950 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-400">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className="text-emerald-400 hover:underline font-medium">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
