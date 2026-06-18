import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { type ApiBody, unwrapData } from './unwrap';

const LS_ACCESS = 'ad_platform_access';
const LS_REFRESH = 'ad_platform_refresh';

export function getAccessToken() {
  return localStorage.getItem(LS_ACCESS);
}

export function getRefreshToken() {
  return localStorage.getItem(LS_REFRESH);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(LS_ACCESS, access);
  localStorage.setItem(LS_REFRESH, refresh);
}

export function clearTokens() {
  localStorage.removeItem(LS_ACCESS);
  localStorage.removeItem(LS_REFRESH);
}

const apiBase = (import.meta.env.VITE_CLOUD_API_URL || '').replace(/\/$/, '');

export const http = axios.create({
  baseURL: `${apiBase}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  validateStatus: (s) => s >= 200 && s < 300,
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const t = getAccessToken();
  if (t) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;
  try {
    const { data: body } = await axios.post<ApiBody<{ accessToken: string; refreshToken?: string }>>(
      `${apiBase}/api/v1/auth/refresh-token`,
      { refreshToken: rt },
      { headers: { 'Content-Type': 'application/json' }, validateStatus: (s) => s >= 200 && s < 300 },
    );
    const data = unwrapData(body);
    if (!data?.accessToken) return null;
    const nextRefresh = data.refreshToken || rt;
    setTokens(data.accessToken, nextRefresh);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || original?._retry || !original) {
      return Promise.reject(error);
    }
    original._retry = true;
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const newToken = await refreshPromise;
    if (!newToken) return Promise.reject(error);
    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${newToken}`;
    return http(original);
  },
);

export { LS_ACCESS, LS_REFRESH };
