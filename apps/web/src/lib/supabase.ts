import { createClient } from '@supabase/supabase-js';

// Production Supabase Credentials for StatusFlow Project (uqritaeteygddlroulov)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://uqritaeteygddlroulov.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcml0YWV0ZXlnZGRscm91bG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMzM2NDAsImV4cCI6MjEwMDgwOTY0MH0.XqDKL9HP1lH_U_TUh_pBGXg6gztNIUgWtPfjJ3fW3bk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
