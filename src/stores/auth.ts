import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import axios from 'axios';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  http,
  setTokens,
} from 'src/api/http';
import { resetInAppNotificationsState } from 'src/composables/useInAppNotifications';
import { unwrapData, type ApiBody } from 'src/api/unwrap';
import {
  disablePushNotifications,
  enablePushNotificationsFromBootRouter,
} from 'src/utils/pushNotifications';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  fullName: string;
  avatarUrl: string | null;
  gender?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  status: string;
  roles?: string[];
  hasPassword?: boolean;
};

const apiBase = (import.meta.env.VITE_CLOUD_API_URL || '').replace(/\/$/, '');

function parseJwtPayload(token: string): { exp?: number } | null {
  try {
    const p = token.split('.')[1];
    if (!p) return null;
    const json = atob(p.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as { exp?: number };
  } catch {
    return null;
  }
}

export function isTokenLikelyExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  const pl = parseJwtPayload(token);
  if (!pl?.exp) return false;
  return pl.exp * 1000 < Date.now() + 60_000;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const permissions = ref<string[]>([]);
  const bootstrapped = ref(false);

  const isAuthenticated = computed(() => !!user.value);

  async function tryRegisterPushAfterAuth() {
    try {
      await enablePushNotificationsFromBootRouter();
    } catch (e) {
      console.warn('[auth] push register skipped', e);
    }
  }

  function hasPermission(code: string) {
    return permissions.value.includes(code);
  }

  /** USM::READ — xem danh sách user (BE: users.route setPermissionForAny USM). */
  const canManageUsers = computed(() => hasPermission('USM::READ'));
  /** RAP::READ — xem vai trò & features (BE: roles/features routes). */
  const canManageRoles = computed(() => hasPermission('RAP::READ'));
  const canManageNotifications = computed(() => hasPermission('NOT::READ'));
  const canAdmin = computed(
    () => canManageUsers.value || canManageRoles.value || canManageNotifications.value,
  );

  function applyLoginPayload(payload: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  }) {
    setTokens(payload.accessToken, payload.refreshToken);
    user.value = payload.user;
  }

  async function fetchMe() {
    const { data: body } = await http.get<ApiBody<{ user: AuthUser; permissions?: string[] }>>('/auth/me');
    const inner = unwrapData(body);
    user.value = inner.user;
    permissions.value = Array.isArray(inner.permissions) ? inner.permissions : [];
  }

  async function loginEmail(email: string, password: string) {
    const res = await axios.post<
      ApiBody<{ accessToken: string; refreshToken: string; user: AuthUser }> | {
        success: false;
        error?: string;
      }
    >(`${apiBase}/api/v1/auth/login`, { email, password }, {
      validateStatus: (s) => s === 200 || s === 401,
    });
    if (res.status === 401) {
      const err = (res.data as { error?: string })?.error;
      throw new Error(err || 'Login failed');
    }
    const body = res.data as ApiBody<{ accessToken: string; refreshToken: string; user: AuthUser }>;
    if (!body?.success || !body.data?.accessToken) {
      throw new Error('Login failed');
    }
    applyLoginPayload(unwrapData(body));
    await fetchMe();
    bootstrapped.value = true;
    await tryRegisterPushAfterAuth();
  }

  async function loginGoogle(idToken: string) {
    const res = await axios.post<
      ApiBody<{ accessToken: string; refreshToken: string; user: AuthUser }> | {
        success: false;
        error?: string;
      }
    >(`${apiBase}/api/v1/auth/google/verify`, { idToken }, {
      validateStatus: (s) => s === 200 || s === 401 || s === 503,
    });
    if (res.status === 401 || res.status === 503) {
      const err = (res.data as { error?: string })?.error;
      throw new Error(err || 'Login failed');
    }
    const body = res.data as ApiBody<{ accessToken: string; refreshToken: string; user: AuthUser }>;
    if (!body?.success || !body.data?.accessToken) {
      throw new Error('Login failed');
    }
    applyLoginPayload(unwrapData(body));
    await fetchMe();
    bootstrapped.value = true;
    await tryRegisterPushAfterAuth();
  }

  async function restoreSession() {
    const at = getAccessToken();
    const rt = getRefreshToken();
    if (!at || !rt) {
      bootstrapped.value = true;
      return false;
    }
    if (isTokenLikelyExpired(at)) {
      try {
        const { data: body } = await axios.post<ApiBody<{ accessToken: string; refreshToken?: string }>>(
          `${apiBase}/api/v1/auth/refresh-token`,
          { refreshToken: rt },
          { validateStatus: (s) => s >= 200 && s < 300 },
        );
        const data = unwrapData(body);
        if (data?.accessToken) {
          setTokens(data.accessToken, data.refreshToken || rt);
        } else {
          clearTokens();
          user.value = null;
          permissions.value = [];
          bootstrapped.value = true;
          return false;
        }
      } catch {
        clearTokens();
        user.value = null;
        permissions.value = [];
        bootstrapped.value = true;
        return false;
      }
    }
    try {
      await fetchMe();
      bootstrapped.value = true;
      await tryRegisterPushAfterAuth();
      return true;
    } catch {
      clearTokens();
      user.value = null;
      permissions.value = [];
      bootstrapped.value = true;
      return false;
    }
  }

  function logout() {
    void disablePushNotifications();
    clearTokens();
    user.value = null;
    permissions.value = [];
    resetInAppNotificationsState();
  }

  return {
    user,
    permissions,
    bootstrapped,
    isAuthenticated,
    hasPermission,
    canManageUsers,
    canManageRoles,
    canManageNotifications,
    canAdmin,
    fetchMe,
    loginEmail,
    loginGoogle,
    restoreSession,
    logout,
  };
});
