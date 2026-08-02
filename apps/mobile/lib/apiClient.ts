import axios from 'axios';
import { supabase } from './supabase';

export const API_BASE_URL = 'https://statusflow.reelas.com.ng/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Every protected route on the API (requireAuth) expects a Supabase-issued bearer token —
// attach the current session's, if any, to every outgoing request.
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
