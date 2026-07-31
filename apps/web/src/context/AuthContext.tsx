import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { apiClient } from '../lib/apiClient';
import { User, Session } from '@supabase/supabase-js';

const PENDING_REFERRAL_KEY = 'sf_pending_referral_code';

function attributePendingReferral() {
  const code = localStorage.getItem(PENDING_REFERRAL_KEY);
  if (!code) return;
  localStorage.removeItem(PENDING_REFERRAL_KEY); // attribute at most once, success or not
  apiClient.attributeReferral(code).catch(() => {
    // Invalid/expired code, or this user already has a referral — safe to ignore.
  });
}

const SUPER_ADMIN_EMAILS = ['abohrandy@gmail.com'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAdmin(currentUser?.email ? SUPER_ADMIN_EMAILS.includes(currentUser.email.toLowerCase()) : false);
      setLoading(false);
      if (currentUser) attributePendingReferral();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAdmin(currentUser?.email ? SUPER_ADMIN_EMAILS.includes(currentUser.email.toLowerCase()) : false);
      setLoading(false);
      if (currentUser) attributePendingReferral();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
