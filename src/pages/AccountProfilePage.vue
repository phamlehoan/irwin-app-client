<template>
  <q-page class="ad-page q-pa-lg">
    <div class="q-mb-lg">
      <div class="ad-page-title">{{ t('app.account_title') }}</div>
      <div class="ad-page-subtitle">{{ auth.user?.email }}</div>
    </div>

    <AdPageSection
      :title="t('app.account_section_profile')"
      editable
      :editing="profileEdit"
      :saving="profileSaving"
      :edit-label="t('app.edit')"
      @edit="startProfileEdit"
      @save="saveProfile"
      @cancel="cancelProfileEdit"
    >
      <q-banner v-if="profileError" class="bg-negative text-white q-mb-md" dense rounded>{{ profileError }}</q-banner>
      <div v-if="!profileEdit" class="ad-detail-grid">
        <div class="ad-detail-field">
          <div class="ad-detail-field__label">{{ t('app.account_first_name') }}</div>
          <div class="ad-detail-field__value">{{ displayProfile.firstName || '—' }}</div>
        </div>
        <div class="ad-detail-field">
          <div class="ad-detail-field__label">{{ t('app.account_last_name') }}</div>
          <div class="ad-detail-field__value">{{ displayProfile.lastName || '—' }}</div>
        </div>
        <div class="ad-detail-field">
          <div class="ad-detail-field__label">{{ t('app.account_middle_name') }}</div>
          <div class="ad-detail-field__value">{{ displayProfile.middleName || '—' }}</div>
        </div>
        <div class="ad-detail-field">
          <div class="ad-detail-field__label">{{ t('app.account_gender') }}</div>
          <div class="ad-detail-field__value">{{ genderLabel(displayProfile.gender) }}</div>
        </div>
        <div class="ad-detail-field">
          <div class="ad-detail-field__label">{{ t('app.account_phone') }}</div>
          <div class="ad-detail-field__value">{{ displayProfile.phoneNumber || '—' }}</div>
        </div>
        <div class="ad-detail-field">
          <div class="ad-detail-field__label">{{ t('app.email') }}</div>
          <div class="ad-detail-field__value">{{ auth.user?.email }}</div>
        </div>
        <div class="ad-detail-field ad-form-grid--span-2">
          <div class="ad-detail-field__label">{{ t('app.account_address') }}</div>
          <div class="ad-detail-field__value">{{ displayProfile.address || '—' }}</div>
        </div>
      </div>
      <div v-else class="ad-form-grid">
        <q-input
          v-model="profileForm.firstName"
          outlined
          dense
          :label="t('app.account_first_name')"
          :error="!!profileFieldErrors.fieldError('firstName')"
          :error-message="profileFieldErrors.fieldError('firstName')"
        />
        <q-input
          v-model="profileForm.lastName"
          outlined
          dense
          :label="t('app.account_last_name')"
          :error="!!profileFieldErrors.fieldError('lastName')"
          :error-message="profileFieldErrors.fieldError('lastName')"
        />
        <q-input
          v-model="profileForm.middleName"
          outlined
          dense
          :label="t('app.account_middle_name')"
          :error="!!profileFieldErrors.fieldError('middleName')"
          :error-message="profileFieldErrors.fieldError('middleName')"
        />
        <q-select
          v-model="profileForm.gender"
          outlined
          dense
          emit-value
          map-options
          :options="genderOptions"
          :label="t('app.account_gender')"
          :error="!!profileFieldErrors.fieldError('gender')"
          :error-message="profileFieldErrors.fieldError('gender')"
        />
        <q-input
          v-model="profileForm.phoneNumber"
          outlined
          dense
          :label="t('app.account_phone')"
          :error="!!profileFieldErrors.fieldError('phoneNumber')"
          :error-message="profileFieldErrors.fieldError('phoneNumber')"
        />
        <AdTextarea
          v-model="profileForm.address"
          class="ad-form-grid--span-3"
          :rows="3"
          :label="t('app.account_address')"
          :error="profileFieldErrors.fieldError('address')"
        />
      </div>
    </AdPageSection>

    <AdPageSection
      id="password-section"
      :title="t('app.account_section_password')"
      editable
      :editing="passwordEdit"
      :saving="passwordSaving"
      :edit-label="t('app.edit')"
      @edit="passwordEdit = true"
      @save="savePassword"
      @cancel="cancelPasswordEdit"
    >
      <q-banner v-if="passwordError" class="bg-negative text-white q-mb-md" dense rounded>{{ passwordError }}</q-banner>
      <p v-if="!passwordEdit" class="text-grey-7 text-body2 q-mb-none">
        {{ hasPassword ? t('app.account_password_hint') : t('app.account_set_password_hint') }}
      </p>
      <template v-else>
        <p v-if="!hasPassword" class="text-body2 text-grey-8 q-mb-md">
          {{ t('app.account_set_password_form_hint') }}
        </p>
        <div class="ad-form-grid ad-form-grid--stacked">
          <q-input
            v-if="hasPassword"
            v-model="passwordForm.oldPassword"
            outlined
            dense
            type="password"
            :label="t('app.account_current_password')"
            autocomplete="current-password"
            :error="!!passwordFieldErrors.fieldError('oldPassword')"
            :error-message="passwordFieldErrors.fieldError('oldPassword')"
          />
          <q-input
            v-model="passwordForm.newPassword"
            outlined
            dense
            type="password"
            :label="t('app.account_new_password')"
            autocomplete="new-password"
            :error="!!passwordFieldErrors.fieldError('newPassword')"
            :error-message="passwordFieldErrors.fieldError('newPassword')"
          />
          <q-input
            v-model="passwordForm.newPasswordConfirmation"
            outlined
            dense
            type="password"
            :label="t('app.account_confirm_password')"
            autocomplete="new-password"
            :error="!!passwordFieldErrors.fieldError('newPasswordConfirmation')"
            :error-message="passwordFieldErrors.fieldError('newPasswordConfirmation')"
          />
        </div>
      </template>
    </AdPageSection>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import AdPageSection from 'src/components/ui/AdPageSection.vue';
import AdTextarea from 'src/components/ui/AdTextarea.vue';
import { useAuthStore } from 'stores/auth';
import { http } from 'src/api/http';
import { notifyApiError } from 'src/api/apiErrors';
import { unwrapData, type ApiBody } from 'src/api/unwrap';
import { useFormFieldErrors } from 'src/composables/useFormFieldErrors';
import { runClientValidation } from 'src/composables/useClientFormValidation';
import { changePasswordSchema, profileSchema } from 'src/validation/formSchemas';

const $q = useQuasar();
const { t } = useI18n();
const route = useRoute();
const auth = useAuthStore();
const profileFieldErrors = useFormFieldErrors();
const passwordFieldErrors = useFormFieldErrors();

const profileEdit = ref(false);
const profileSaving = ref(false);
const profileError = ref('');

const passwordEdit = ref(false);
const passwordSaving = ref(false);
const passwordError = ref('');

const profileForm = reactive({
  firstName: '',
  lastName: '',
  middleName: '',
  gender: '' as string,
  phoneNumber: '',
  address: '',
});

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  newPasswordConfirmation: '',
});

const displayProfile = computed(() => ({
  firstName: auth.user?.firstName ?? '',
  lastName: auth.user?.lastName ?? '',
  middleName: auth.user?.middleName ?? '',
  gender: auth.user?.gender ?? '',
  phoneNumber: auth.user?.phoneNumber ?? '',
  address: auth.user?.address ?? '',
}));

const hasPassword = computed(() => auth.user?.hasPassword ?? true);

const genderOptions = computed(() => [
  { label: t('app.account_gender_unspecified'), value: '' },
  { label: t('app.account_gender_male'), value: 'MALE' },
  { label: t('app.account_gender_female'), value: 'FEMALE' },
  { label: t('app.account_gender_other'), value: 'OTHER' },
]);

function genderLabel(v: string | null | undefined) {
  if (!v) return t('app.account_gender_unspecified');
  const m: Record<string, string> = {
    MALE: t('app.account_gender_male'),
    FEMALE: t('app.account_gender_female'),
    OTHER: t('app.account_gender_other'),
  };
  return m[v] || v;
}

function syncProfileFormFromUser() {
  profileForm.firstName = auth.user?.firstName ?? '';
  profileForm.lastName = auth.user?.lastName ?? '';
  profileForm.middleName = auth.user?.middleName ?? '';
  profileForm.gender = auth.user?.gender ?? '';
  profileForm.phoneNumber = auth.user?.phoneNumber ?? '';
  profileForm.address = auth.user?.address ?? '';
}

function startProfileEdit() {
  profileError.value = '';
  profileFieldErrors.clear();
  syncProfileFormFromUser();
  profileEdit.value = true;
}

function cancelProfileEdit() {
  profileEdit.value = false;
  profileError.value = '';
  profileFieldErrors.clear();
}

async function saveProfile() {
  profileError.value = '';
  profileFieldErrors.clear();
  if (
    !runClientValidation(
      profileFieldErrors,
      profileSchema(t),
      profileForm,
      $q,
      t('app.account_generic_error'),
    )
  ) {
    return;
  }
  profileSaving.value = true;
  try {
    const { data: body } = await http.patch<
      ApiBody<{ user: typeof auth.user; permissions: string[] }>
    >('/auth/me/profile', {
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      middleName: profileForm.middleName.trim() || null,
      gender: profileForm.gender || null,
      phoneNumber: profileForm.phoneNumber.trim() || null,
      address: profileForm.address.trim() || null,
    });
    unwrapData(body);
    await auth.fetchMe();
    profileEdit.value = false;
    $q.notify({ type: 'positive', message: t('app.account_profile_saved'), position: 'top' });
  } catch (e) {
    const parsed = profileFieldErrors.applyFromUnknown(e);
    profileError.value = parsed.message || t('app.account_generic_error');
    notifyApiError($q, parsed, t('app.account_generic_error'), 'top');
  } finally {
    profileSaving.value = false;
  }
}

function cancelPasswordEdit() {
  passwordEdit.value = false;
  passwordError.value = '';
  passwordFieldErrors.clear();
  passwordForm.oldPassword = '';
  passwordForm.newPassword = '';
  passwordForm.newPasswordConfirmation = '';
}

async function savePassword() {
  passwordError.value = '';
  passwordFieldErrors.clear();
  if (
    !runClientValidation(
      passwordFieldErrors,
      changePasswordSchema(t, hasPassword.value),
      passwordForm,
      $q,
      t('app.account_generic_error'),
    )
  ) {
    return;
  }
  passwordSaving.value = true;
  try {
    const payload: Record<string, string> = {
      newPassword: passwordForm.newPassword,
      newPasswordConfirmation: passwordForm.newPasswordConfirmation,
    };
    if (hasPassword.value) payload.oldPassword = passwordForm.oldPassword;
    const { data: body } = await http.post<ApiBody<{ ok: boolean }>>('/auth/me/password', payload);
    unwrapData(body);
    const wasSettingPassword = !hasPassword.value;
    await auth.fetchMe();
    $q.notify({
      type: 'positive',
      message: wasSettingPassword ? t('app.account_set_password_saved') : t('app.account_password_saved'),
      position: 'top',
    });
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.newPasswordConfirmation = '';
    passwordEdit.value = false;
  } catch (e) {
    const parsed = passwordFieldErrors.applyFromUnknown(e);
    passwordError.value = parsed.message || t('app.account_generic_error');
    notifyApiError($q, parsed, t('app.account_generic_error'), 'top');
  } finally {
    passwordSaving.value = false;
  }
}

async function openPasswordFromQuery() {
  if (route.query.section !== 'password') return;
  passwordEdit.value = true;
  await nextTick();
  document.getElementById('password-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

watch(() => route.query.section, () => void openPasswordFromQuery());

onMounted(async () => {
  try {
    await auth.fetchMe();
  } catch {
    /* router should require auth */
  }
  syncProfileFormFromUser();
  await openPasswordFromQuery();
});
</script>
