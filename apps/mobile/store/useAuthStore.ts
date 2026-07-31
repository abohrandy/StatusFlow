import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const SUPER_ADMIN_EMAILS = ['abohrandy@gmail.com'];

interface UserProfile {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isSessionLoading: boolean;
  setUserFromSupabase: (user: User | null) => void;
  setSessionLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

function toUserProfile(user: User | null): UserProfile | null {
  if (!user || !user.email) return null;
  return {
    id: user.id,
    email: user.email,
    role: SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase()) ? 'ADMIN' : 'USER',
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isSessionLoading: true,
  setUserFromSupabase: (user) => {
    const profile = toUserProfile(user);
    set({ user: profile, isAuthenticated: !!profile });
  },
  setSessionLoading: (loading) => set({ isSessionLoading: loading }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },
}));
