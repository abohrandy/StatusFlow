import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Same Supabase project as apps/web/src/lib/supabase.ts.
const supabaseUrl = 'https://uqritaeteygddlroulov.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcml0YWV0ZXlnZGRscm91bG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMzM2NDAsImV4cCI6MjEwMDgwOTY0MH0.XqDKL9HP1lH_U_TUh_pBGXg6gztNIUgWtPfjJ3fW3bk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
