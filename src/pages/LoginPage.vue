<template>
  <q-layout view="lHh Lpr lFf" class="auth-page-bg">
    <q-page-container class="login-page-container">
      <q-page class="login-page">
        <q-card class="login-card" flat bordered>
          <q-card-section class="text-center">
            <div class="text-h5 text-weight-medium">{{ t('app.product_name') }}</div>
            <div class="text-caption text-grey-7 q-mt-xs">{{ t('app.login_subtitle') }}</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="login-card-body">
            <q-banner
              v-if="successBanner"
              class="bg-positive text-white login-field q-mb-sm"
              dense
              rounded
            >
              {{ successBanner }}
            </q-banner>
            <q-form class="login-form-stack" @submit.prevent="onSubmit">
              <q-input
                v-model="email"
                outlined
                dense
                type="email"
                :label="t('app.email')"
                :disable="loading"
                autocomplete="username"
                class="login-field"
                :error="!!loginFieldErrors.fieldError('email')"
                :error-message="loginFieldErrors.fieldError('email')"
              />
              <q-input
                v-model="password"
                outlined
                dense
                type="password"
                :label="t('app.password')"
                :disable="loading"
                autocomplete="current-password"
                class="login-field"
                :error="!!loginFieldErrors.fieldError('password')"
                :error-message="loginFieldErrors.fieldError('password')"
                @keyup.enter="onSubmit"
              />
              <q-banner
                v-if="errorMsg"
                class="bg-negative text-white login-field"
                dense
                rounded
              >
                {{ errorMsg }}
              </q-banner>
              <q-btn
                unelevated
                color="primary"
                no-wrap
                padding="sm md"
                class="login-field login-submit-btn"
                type="submit"
                :label="t('app.sign_in')"
                :loading="loading"
              />
            </q-form>
            <div v-if="googleClientId" class="q-mt-md column items-center">
              <div class="text-caption text-grey-7 q-mb-sm">{{ t('app.or') }}</div>
              <div :id="googleButtonHostId" class="google-btn-host" />
            </div>
            <q-banner v-else class="bg-grey-3 q-mt-md" dense rounded>
              <span class="text-caption">{{ t('app.google_missing') }}</span>
            </q-banner>
            <div class="text-center q-mt-sm">
              <router-link to="/forgot-password" class="text-primary text-caption">
                {{ t('app.forgot_password_link') }}
              </router-link>
            </div>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useFormFieldErrors } from 'src/composables/useFormFieldErrors';
import { runClientValidation } from 'src/composables/useClientFormValidation';
import { loginSchema } from 'src/validation/formSchemas';
import { useAuthStore } from 'stores/auth';

const { t } = useI18n();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const loginFieldErrors = useFormFieldErrors();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');
const successBanner = ref('');

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
const googleButtonHostId = 'g_id_signin_ad_platform';

let gsiScript: HTMLScriptElement | null = null;

const GOOGLE_REQUEST_TOKEN_KEY = 'google_request_id_token';

function mapLoginErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : '';
  if (msg === 'ACCOUNT_PENDING_ACTIVATION') {
    return t('app.login_pending_activation');
  }
  if (msg === 'ACCOUNT_REQUESTING') {
    return t('app.login_requesting');
  }
  if (msg === 'ACCOUNT_INACTIVE') {
    return t('app.login_inactive');
  }
  if (msg.includes('complete activation') || msg.includes('not active yet')) {
    return t('app.login_pending_activation');
  }
  return t('app.login_failed');
}

function resolveTargetPath(): string {
  const r = route.query.redirect;
  if (typeof r === 'string' && r.trim()) {
    const s = r.trim();
    if (s.startsWith('/') && !s.startsWith('//') && s !== '/login' && !s.startsWith('/login?')) {
      return s;
    }
  }
  return '/';
}

async function redirectAfterLogin() {
  const path = resolveTargetPath();
  try {
    await router.replace(path);
  } catch {
    /* ignore navigation errors */
  }
  await nextTick();
  await nextTick();
  router.go(0);
}

async function onGoogleCredential(resp: { credential?: string }) {
  const idToken = resp?.credential;
  if (!idToken || loading.value) return;
  errorMsg.value = '';
  loading.value = true;
  try {
    await auth.loginGoogle(idToken);
    await redirectAfterLogin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'ACCOUNT_NOT_FOUND') {
      sessionStorage.setItem(GOOGLE_REQUEST_TOKEN_KEY, idToken);
      await router.push('/google-request-account');
      return;
    }
    errorMsg.value = mapLoginErrorMessage(e);
  } finally {
    loading.value = false;
  }
}

function initGoogle() {
  if (!googleClientId) return;
  const w = window as Window & {
    google?: {
      accounts: {
        id: {
          initialize: (o: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
        };
      };
    };
  };
  if (!w.google?.accounts?.id) return;
  w.google.accounts.id.initialize({
    client_id: googleClientId,
    callback: onGoogleCredential,
    auto_select: false,
    cancel_on_tap_outside: true,
  });
  const el = document.getElementById(googleButtonHostId);
  if (el) {
    el.innerHTML = '';
    w.google.accounts.id.renderButton(el, {
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'signin_with',
      locale: 'vi',
    });
  }
}

async function onSubmit() {
  errorMsg.value = '';
  loginFieldErrors.clear();
  if (
    !runClientValidation(
      loginFieldErrors,
      loginSchema(t),
      { email: email.value, password: password.value },
      $q,
      t('app.login_failed'),
    )
  ) {
    return;
  }
  loading.value = true;
  try {
    await auth.loginEmail(email.value.trim(), password.value);
    await redirectAfterLogin();
  } catch (e) {
    const parsed = loginFieldErrors.applyFromUnknown(e);
    if (Object.keys(parsed.fieldErrors).length > 0) {
      errorMsg.value = parsed.message;
      return;
    }
    errorMsg.value = mapLoginErrorMessage(e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (route.query.activated === '1') {
    successBanner.value = t('app.login_activated_ok');
  } else if (route.query.reset === '1') {
    successBanner.value = t('app.login_password_reset_ok');
  } else if (route.query.requested === '1') {
    successBanner.value = t('app.login_request_submitted');
  }
  if (!googleClientId) return;
  gsiScript = document.createElement('script');
  gsiScript.src = 'https://accounts.google.com/gsi/client';
  gsiScript.async = true;
  gsiScript.defer = true;
  gsiScript.onload = () => initGoogle();
  document.head.appendChild(gsiScript);
});

onBeforeUnmount(() => {
  if (gsiScript?.parentNode) gsiScript.parentNode.removeChild(gsiScript);
});
</script>

<style scoped>
.login-bg {
  min-height: 100vh;
}

.login-page-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.login-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.login-card-body {
  width: 100%;
  box-sizing: border-box;
}

.login-form-stack {
  width: 100%;
  max-width: 20rem;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.75rem;
}

.login-form-stack :deep(> *) {
  margin-left: 0 !important;
}

.login-field {
  width: 100%;
  max-width: 100%;
}

.login-submit-btn {
  min-height: 2.75rem;
}

.login-submit-btn :deep(.q-btn__wrapper) {
  width: 100%;
  justify-content: center;
}

.login-submit-btn :deep(.q-btn__content) {
  width: 100%;
  justify-content: center;
  text-align: center;
}

.google-btn-host {
  display: flex;
  justify-content: center;
  width: 100%;
  min-height: 42px;
}
</style>
