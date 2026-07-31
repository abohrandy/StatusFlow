import { ApiClient } from '@statusflow/api-client';
import { supabase } from './supabase';

export const apiClient = new ApiClient({
  baseUrl: (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1',
  getAuthToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  },
});
