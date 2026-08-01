import axios from 'axios';

export const API_BASE_URL = 'https://statusflow.reelas.com.ng/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});
