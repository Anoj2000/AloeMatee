import axios from 'axios';
import { Endpoints } from '@/constants';

const http = axios.create({
  baseURL: Endpoints.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor — attach auth token if available
http.interceptors.request.use(
  (config) => {
    // Example: attach bearer token from secure storage
    // const token = await SecureStore.getItemAsync('auth_token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — normalise error messages
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? 'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  },
);

export default http;
