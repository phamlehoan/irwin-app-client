<template>
  <q-layout view="lHh Lpr lFf" class="auth-page-bg">
    <q-page-container class="login-page-container">
      <q-page class="login-page">
        <q-card class="login-card" flat bordered>
          <q-card-section class="text-center">
            <div class="text-h5 text-weight-medium">{{ t('app.product_name') }}</div>
            <div class="text-caption text-grey-7 q-mt-xs">{{ t('app.google_request_title') }}</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="login-card-body">
            <template v-if="!confirmed">
              <q-banner class="bg-blue-1 text-dark q-mb-md" dense rounded>
                {{ t('app.google_request_not_found') }}
              </q-banner>
              <p class="text-body2 q-mb-md">{{ t('app.google_request_prompt') }}</p>
              <div class="column q-gutter-sm">
                <q-btn
                  unelevated
                  color="primary"
                  no-caps
                  :label="t('app.google_request_yes')"
                  @click="confirmed = true"
                />
                <q-btn flat no-caps color="primary" :label="t('app.google_request_no')" to="/login" />
              </div>
            </template>
            <template v-else>
              <p class="text-body2 q-mb-md">{{ t('app.google_request_password_hint') }}</p>
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
                  :label="t('app.google_request_submit')"
                  :loading="submitting"
                />
              </q-form>
              <div class="text-center q-mt-md">
                <router-link to="/login" class="text-primary text-caption">
                  {{ t('app.activate_back_login') }}
                </router-link>
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
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import { resolveSubmitError, type ApiErrorBody } from 'src/api/apiErrors';
import { unwrapData, type ApiBody } from 'src/api/unwrap';
import { useFormFieldErrors } from 'src/composables/useFormFieldErrors';
import { runClientValidation } from 'src/composables/useClientFormValidation';
import { passwordPairSchema } from 'src/validation/formSchemas';
import { useQuasar } from 'quasar';

const GOOGLE_TOKEN_KEY = 'google_request_id_token';

const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();
const formErrors = useFormFieldErrors();

const apiBase = (import.meta.env.VITE_CLOUD_API_URL || '').replace(/\/$/, '');

const confirmed = ref(false);
const password = ref('');
const passwordConfirmation = ref('');
const submitting = ref(false);
const submitError = ref('');
const idToken = ref('');

onMounted(() => {
  const token = sessionStorage.getItem(GOOGLE_TOKEN_KEY)?.trim() || '';
  if (!token) {
    void router.replace('/login');
    return;
  }
  idToken.value = token;
});

async function onSubmit() {
  submitError.value = '';
  formErrors.clear();
  if (!idToken.value) {
    submitError.value = t('app.google_request_missing_token');
    return;
  }
  if (
    !runClientValidation(
      formErrors,
      passwordPairSchema(t),
      { password: password.value, passwordConfirmation: passwordConfirmation.value },
      $q,
      t('app.google_request_failed'),
    )
  ) {
    return;
  }
  submitting.value = true;
  try {
    const res = await axios.post<ApiBody<{ ok: boolean }>>(
      `${apiBase}/api/v1/auth/google/request-account`,
      {
        idToken: idToken.value,
        password: password.value,
        passwordConfirmation: passwordConfirmation.value,
      },
      { validateStatus: (s) => s === 201 || s === 422 || s === 401 },
    );
    if (res.status !== 201 || !res.data?.success) {
      submitError.value = resolveSubmitError(res.data as ApiErrorBody, (body) => formErrors.applyFromBody(body), {
        fallback: t('app.google_request_failed'),
      });
      return;
    }
    unwrapData(res.data);
    sessionStorage.removeItem(GOOGLE_TOKEN_KEY);
    await router.replace('/login?requested=1');
  } catch (e) {
    const parsed = formErrors.applyFromUnknown(e);
    submitError.value = parsed.message || t('app.google_request_failed');
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
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
  max-width: 420px;
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

.login-field {
  width: 100%;
  max-width: 100%;
}

.login-submit-btn {
  min-height: 2.75rem;
}
</style>
