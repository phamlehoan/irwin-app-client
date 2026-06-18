<template>
  <q-layout view="lHh Lpr lFf" class="auth-page-bg">
    <q-page-container class="login-page-container">
      <q-page class="login-page">
        <q-card class="login-card" flat bordered>
          <q-card-section class="text-center">
            <div class="text-h5 text-weight-medium">{{ t('app.product_name') }}</div>
            <div class="text-caption text-grey-7 q-mt-xs">{{ t('app.reset_password_title') }}</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="login-card-body">
            <div v-if="loadingVerify" class="flex flex-center q-py-lg">
              <q-spinner color="primary" size="2em" />
            </div>
            <template v-else-if="verifyError">
              <q-banner class="bg-negative text-white" dense rounded>{{ verifyError }}</q-banner>
            </template>
            <template v-else>
              <div class="text-body2 q-mb-md">
                {{ t('app.reset_password_for_email') }}
                <strong>{{ preview?.email }}</strong>
              </div>
              <q-form class="login-form-stack" @submit.prevent="onSubmit">
                <q-input
                  v-model="password"
                  outlined
                  dense
                  type="password"
                  :label="t('app.account_new_password')"
                  :disable="submitting"
                  autocomplete="new-password"
                  class="login-field"
                  :error="!!formErrors.fieldError('password')"
                  :error-message="formErrors.fieldError('password')"
                />
                <q-input
                  v-model="passwordConfirmation"
                  outlined
                  dense
                  type="password"
                  :label="t('app.account_confirm_password')"
                  :disable="submitting"
                  autocomplete="new-password"
                  class="login-field"
                  :error="!!formErrors.fieldError('passwordConfirmation')"
                  :error-message="formErrors.fieldError('passwordConfirmation')"
                />
                <q-banner v-if="submitError" class="bg-negative text-white login-field" dense rounded>
                  {{ submitError }}
                </q-banner>
                <q-btn
                  unelevated
                  color="primary"
                  no-wrap
                  padding="sm md"
                  class="login-field login-submit-btn"
                  type="submit"
                  :label="t('app.reset_password_submit')"
                  :loading="submitting"
                />
              </q-form>
              <div class="text-center q-mt-md">
                <router-link to="/login" class="text-primary text-caption">{{ t('app.activate_back_login') }}</router-link>
              </div>
            </template>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import { resolveSubmitError, type ApiErrorBody } from 'src/api/apiErrors';
import { unwrapData, type ApiBody } from 'src/api/unwrap';
import { useFormFieldErrors } from 'src/composables/useFormFieldErrors';
import { runClientValidation } from 'src/composables/useClientFormValidation';
import { passwordPairSchema } from 'src/validation/formSchemas';
import { useQuasar } from 'quasar';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const formErrors = useFormFieldErrors();

const apiBase = (import.meta.env.VITE_CLOUD_API_URL || '').replace(/\/$/, '');

const loadingVerify = ref(true);
const verifyError = ref('');
const preview = ref<{ email: string; firstName: string; lastName: string } | null>(null);

const password = ref('');
const passwordConfirmation = ref('');
const submitting = ref(false);
const submitError = ref('');

function mapAuthErrorMessage(code: string | undefined, fallback: string): string {
  if (code === 'ACCOUNT_INACTIVE') return t('app.account_inactive');
  return code || fallback;
}

async function runVerify() {
  const token = typeof route.query.token === 'string' ? route.query.token.trim() : '';
  if (!token) {
    verifyError.value = t('app.reset_password_missing_token');
    loadingVerify.value = false;
    return;
  }
  try {
    const res = await axios.get<ApiBody<{ email: string; firstName: string; lastName: string }>>(
      `${apiBase}/api/v1/auth/password-reset/verify`,
      { params: { token }, validateStatus: (s) => s === 200 || s === 401 || s === 400 },
    );
    if (res.status !== 200 || !res.data?.success) {
      verifyError.value = mapAuthErrorMessage(
        (res.data as { error?: string })?.error,
        t('app.reset_password_invalid_token'),
      );
      preview.value = null;
    } else {
      preview.value = unwrapData(res.data);
    }
  } catch {
    verifyError.value = t('app.reset_password_invalid_token');
  } finally {
    loadingVerify.value = false;
  }
}

async function onSubmit() {
  submitError.value = '';
  formErrors.clear();
  const token = typeof route.query.token === 'string' ? route.query.token.trim() : '';
  if (!token) {
    submitError.value = t('app.reset_password_missing_token');
    return;
  }
  if (
    !runClientValidation(
      formErrors,
      passwordPairSchema(t),
      { password: password.value, passwordConfirmation: passwordConfirmation.value },
      $q,
      t('app.account_generic_error'),
    )
  ) {
    return;
  }
  submitting.value = true;
  try {
    const res = await axios.post<ApiBody<{ ok: boolean }>>(
      `${apiBase}/api/v1/auth/password-reset/accept`,
      {
        token,
        password: password.value,
        passwordConfirmation: passwordConfirmation.value,
      },
      { validateStatus: (s) => s === 200 || s === 401 || s === 422 },
    );
    if (res.status !== 200 || !res.data?.success) {
      submitError.value = resolveSubmitError(res.data as ApiErrorBody, (body) => formErrors.applyFromBody(body), {
        fallback: t('app.account_generic_error'),
        mapCode: (code) => mapAuthErrorMessage(code, '') || undefined,
      });
      return;
    }
    await router.replace({ path: '/login', query: { reset: '1' } });
  } catch (e) {
    const parsed = formErrors.applyFromUnknown(e);
    submitError.value = parsed.message || t('app.account_generic_error');
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  void runVerify();
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
</style>
