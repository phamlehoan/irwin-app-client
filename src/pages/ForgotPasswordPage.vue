<template>
  <q-layout view="lHh Lpr lFf" class="auth-page-bg">
    <q-page-container class="login-page-container">
      <q-page class="login-page">
        <q-card class="login-card" flat bordered>
          <q-card-section class="text-center">
            <div class="text-h5 text-weight-medium">{{ t('app.product_name') }}</div>
            <div class="text-caption text-grey-7 q-mt-xs">{{ t('app.forgot_password_title') }}</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="login-card-body">
            <q-banner
              v-if="successMsg"
              class="bg-positive text-white login-field q-mb-sm"
              dense
              rounded
            >
              {{ successMsg }}
            </q-banner>
            <p v-if="!successMsg" class="text-body2 text-grey-8 q-mb-md">
              {{ t('app.forgot_password_hint') }}
            </p>
            <q-form v-if="!successMsg" class="login-form-stack" @submit.prevent="onSubmit">
              <q-input
                v-model="email"
                outlined
                dense
                type="email"
                :label="t('app.email')"
                :disable="loading"
                autocomplete="username"
                class="login-field"
                :error="!!formErrors.fieldError('email')"
                :error-message="formErrors.fieldError('email')"
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
                :label="t('app.forgot_password_submit')"
                :loading="loading"
              />
            </q-form>
            <div class="text-center q-mt-md">
              <router-link to="/login" class="text-primary text-caption">
                {{ t('app.activate_back_login') }}
              </router-link>
            </div>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { unwrapData, type ApiBody } from 'src/api/unwrap';
import { resolveSubmitError, type ApiErrorBody } from 'src/api/apiErrors';
import { useFormFieldErrors } from 'src/composables/useFormFieldErrors';
import { runClientValidation } from 'src/composables/useClientFormValidation';
import { forgotPasswordSchema } from 'src/validation/formSchemas';

const { t } = useI18n();
const $q = useQuasar();
const formErrors = useFormFieldErrors();

const apiBase = (import.meta.env.VITE_CLOUD_API_URL || '').replace(/\/$/, '');

const email = ref('');
const loading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

async function onSubmit() {
  errorMsg.value = '';
  formErrors.clear();
  if (
    !runClientValidation(
      formErrors,
      forgotPasswordSchema(t),
      { email: email.value },
      $q,
      t('app.forgot_password_failed'),
    )
  ) {
    return;
  }
  loading.value = true;
  try {
    const res = await axios.post<
      ApiBody<{ ok: boolean; message?: string }> | { success: false; error?: string; errors?: Record<string, string[]> }
    >(
      `${apiBase}/api/v1/auth/password-reset/request`,
      { email: email.value.trim() },
      { validateStatus: (s) => s >= 200 && s < 500 },
    );
    if (res.status === 422 || !res.data?.success) {
      errorMsg.value = resolveSubmitError(res.data as ApiErrorBody, (body) => formErrors.applyFromBody(body), {
        fallback: t('app.forgot_password_failed'),
      });
      return;
    }
    if (res.status >= 400) {
      errorMsg.value = t('app.forgot_password_failed');
      return;
    }
    unwrapData(res.data as ApiBody<{ ok: boolean }>);
    successMsg.value = t('app.forgot_password_sent');
  } catch {
    errorMsg.value = t('app.forgot_password_failed');
  } finally {
    loading.value = false;
  }
}
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
