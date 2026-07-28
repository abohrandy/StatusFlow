import React from 'react';
import { supabase } from '../lib/supabase';

export const Login: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setError(error.message + ' (Enable Google Provider in Supabase Auth -> Providers)');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-sm text-zinc-400">Sign in to manage your scheduled WhatsApp statuses</p>
        </div>

        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
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
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-zinc-400">Password</label>
              <button type="button" onClick={() => onNavigate('forgot-password')} className="text-xs text-emerald-400 hover:underline">
                Forgot password?
              </button>
            </div>
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-zinc-800 w-full"></div>
          <span className="bg-zinc-900 px-3 text-xs text-zinc-500 uppercase font-medium">Or</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-2"
        >
          Continue with Google
        </button>

        <div className="text-center text-xs text-zinc-400">
          Don't have an account?{' '}
          <button onClick={() => onNavigate('register')} className="text-emerald-400 hover:underline font-medium">
            Create one
          </button>
        </div>
      </div>
    </div>
  );
};
