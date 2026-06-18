<template>
  <q-page class="q-pa-md notif-topic-detail-page ad-page">
    <div class="notif-topic-detail__header q-mb-md">
      <div class="notif-topic-detail__header-main row items-center no-wrap">
        <q-btn
          flat
          dense
          icon="arrow_back"
          to="/notifications/settings"
          class="ad-icon-btn q-mr-sm"
          :aria-label="t('app.back')"
        />
        <div class="notif-topic-detail__title text-h6 ellipsis col">{{ detail?.name || code }}</div>
        <q-badge
          v-if="detail"
          class="q-ml-sm shrink-0"
          :color="detail.kind === 'system' ? 'blue-grey' : 'teal'"
          :label="kindLabel(detail.kind)"
        />
      </div>
      <div v-if="canUpdate" class="notif-topic-detail__actions row items-center q-gutter-xs">
        <q-btn
          outline
          color="primary"
          icon="send"
          :label="isCompactActions ? undefined : t('app.notif_push_now')"
          :loading="pushing"
          :disable="isDirty"
          @click="pushNow"
        >
          <q-tooltip v-if="isDirty">{{ t('app.notif_unsaved_before_push') }}</q-tooltip>
          <q-tooltip v-else>{{ t('app.notif_push_now') }}</q-tooltip>
        </q-btn>
        <q-btn
          v-if="detail?.kind === 'manual'"
          flat
          no-caps
          color="negative"
          icon="delete"
          :label="isCompactActions ? undefined : t('app.notif_delete_topic')"
          class="ad-btn-outline ad-btn-outline--danger"
          @click="confirmDelete"
        >
          <q-tooltip>{{ t('app.notif_delete_topic') }}</q-tooltip>
        </q-btn>
        <q-btn
          color="primary"
          icon="save"
          :label="isCompactActions ? undefined : t('app.save')"
          :loading="saving"
          @click="save"
        >
          <q-tooltip>{{ t('app.save') }}</q-tooltip>
        </q-btn>
      </div>
    </div>

    <q-banner v-if="error" class="bg-negative text-white q-mb-md" dense rounded>{{ error }}</q-banner>
    <q-banner v-else-if="isDirty && canUpdate" dense rounded class="bg-amber-2 text-dark q-mb-md">
      {{ t('app.notif_unsaved_before_push') }}
    </q-banner>
    <div v-if="loading" class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="2em" />
    </div>

    <div v-else-if="!detail" class="text-body2 text-grey-8 q-py-md">
      {{ t('app.notif_detail_empty') }}
    </div>

    <div v-else class="column q-gutter-md notif-topic-detail__content">
      <q-banner v-if="!canUpdate" dense rounded class="bg-amber-2 text-dark">
        {{ t('app.notif_readonly_hint') }}
      </q-banner>
      <q-banner v-else-if="detail.kind === 'system'" dense rounded class="bg-blue-1 text-dark">
        {{ t('app.notif_kind_system_hint') }}
      </q-banner>

      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle2 text-grey-8">{{ detail.code }}</div>
          <q-input
            v-if="detail.kind === 'manual' && canUpdate"
            v-model="form.name"
            class="q-mt-sm"
            outlined
            dense
            :label="t('app.col_name')"
            :error="!!formErrors.fieldError('name')"
            :error-message="formErrors.fieldError('name')"
          />
          <div v-else class="text-body1 q-mt-xs">{{ detail.name }}</div>
          <AdTextarea
            v-if="detail.kind === 'manual' && canUpdate"
            v-model="form.description"
            class="q-mt-sm"
            :rows="3"
            :label="t('app.notif_create_description')"
            :error="formErrors.fieldError('description')"
          />
          <div v-else-if="detail.description" class="text-body2 q-mt-xs">{{ detail.description }}</div>
        </q-card-section>
      </q-card>

      <q-card v-if="detail.kind === 'manual'" flat bordered>
        <q-card-section class="row items-center wrap q-gutter-y-sm">
          <div class="text-subtitle1 col-grow">{{ t('app.notif_cron_section') }}</div>
          <q-toggle
            v-model="cronScheduleEnabled"
            :disable="!canUpdate"
            color="primary"
            :label="t('app.notif_enabled')"
          />
        </q-card-section>
        <q-banner v-if="!cronScheduleEnabled" dense rounded class="bg-blue-1 text-dark q-mx-md q-mb-sm">
          {{ t('app.notif_cron_off') }}
        </q-banner>
        <q-separator v-if="cronScheduleEnabled" />
        <q-card-section v-if="cronScheduleEnabled" class="column q-gutter-md">
          <q-input
            v-model="form.cronSchedule"
            outlined
            :disable="!canUpdate"
            :label="t('app.notif_cron_schedule')"
            :hint="t('app.notif_cron_schedule_hint')"
            :error="!!formErrors.fieldError('cronSchedule')"
            :error-message="formErrors.fieldError('cronSchedule')"
          />
        </q-card-section>
      </q-card>

      <q-card flat bordered>
        <q-card-section class="text-subtitle1">{{ t('app.notif_variables') }}</q-card-section>
        <q-separator />
        <q-card-section>
          <div
            v-if="variableHelpHtml"
            class="notif-variable-help-md text-body2"
            v-html="variableHelpHtml"
          />
          <div v-else class="text-grey-6 text-body2">—</div>
        </q-card-section>
      </q-card>

      <q-card flat bordered>
        <q-card-section class="row items-center wrap q-gutter-y-sm">
          <div class="text-subtitle1 col-grow">{{ t('app.notif_email_channel') }}</div>
          <q-toggle v-model="form.emailEnabled" :disable="!canUpdate" color="primary" :label="t('app.notif_enabled')" />
        </q-card-section>
        <q-banner v-if="!form.emailEnabled" dense rounded class="bg-blue-1 text-dark q-mx-md q-mb-sm">
          {{ t('app.notif_channel_off') }}
        </q-banner>
        <q-separator v-if="form.emailEnabled" />
        <q-card-section v-if="form.emailEnabled" class="column q-gutter-md">
          <div class="text-subtitle2 text-grey-8">{{ t('app.notif_recipient_target') }}</div>
          <NotifRecipientTargeting
            v-model:mode="form.emailRecipientMode"
            v-model:role-ids="form.emailRecipientRoleIds"
            :role-options="roleOptions"
            :disabled="!canUpdate"
            :role-label="t('app.notif_recipient_roles')"
            :role-hint="''"
          />
          <AdTextarea
            v-model="form.emailSubject"
            :disable="!canUpdate"
            compact
            :rows="2"
            :label="t('app.notif_email_subject')"
            :error="formErrors.fieldError('emailSubject')"
          />
          <div class="text-subtitle2 text-grey-8 q-mt-sm">{{ t('app.notif_email_body_label') }}</div>
          <q-banner
            v-if="formErrors.fieldError('emailBodyMarkdown')"
            dense
            rounded
            class="bg-negative text-white q-mb-sm"
          >
            {{ formErrors.fieldError('emailBodyMarkdown') }}
          </q-banner>
          <NotifEmailBodyEditor
            v-model="form.emailBodyMarkdown"
            :editor-id="mdEditorId"
            :editor-key="`${detail.code}-${isEditorMobile ? 'mobile' : 'desktop'}`"
            :read-only="!canUpdate"
            :error="formErrors.fieldError('emailBodyMarkdown')"
          />
        </q-card-section>
      </q-card>

      <q-card flat bordered>
        <q-card-section class="row items-center wrap q-gutter-y-sm">
          <div class="text-subtitle1 col-grow">{{ t('app.notif_app_channel') }}</div>
          <q-toggle v-model="form.appEnabled" :disable="!canUpdate" color="primary" :label="t('app.notif_enabled')" />
        </q-card-section>
        <q-banner v-if="!form.appEnabled" dense rounded class="bg-blue-1 text-dark q-mx-md q-mb-sm">
          {{ t('app.notif_channel_off') }}
        </q-banner>
        <q-separator v-if="form.appEnabled" />
        <q-card-section v-if="form.appEnabled" class="column q-gutter-md">
          <div class="text-subtitle2 text-grey-8">{{ t('app.notif_recipient_target') }}</div>
          <NotifRecipientTargeting
            v-model:mode="form.appRecipientMode"
            v-model:role-ids="form.appRecipientRoleIds"
            :role-options="roleOptions"
            :disabled="!canUpdate"
            :role-label="t('app.notif_recipient_roles')"
            :role-hint="''"
          />
          <q-input
            v-model="form.appTitleText"
            outlined
            :disable="!canUpdate"
            :label="t('app.notif_app_title')"
            :error="!!formErrors.fieldError('appTitleText')"
            :error-message="formErrors.fieldError('appTitleText')"
          />
          <AdTextarea
            v-model="form.appBodyText"
            :disable="!canUpdate"
            :rows="4"
            :label="t('app.notif_app_body')"
            :error="formErrors.fieldError('appBodyText')"
          />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { http } from 'src/api/http';
import { notifyApiError, parseApiError } from 'src/api/apiErrors';
import { unwrapData, type ApiBody } from 'src/api/unwrap';
import { useFormFieldErrors } from 'src/composables/useFormFieldErrors';
import { runClientValidation } from 'src/composables/useClientFormValidation';
import { notificationTopicManualSaveSchema } from 'src/validation/formSchemas';
import AdTextarea from 'src/components/ui/AdTextarea.vue';
import NotifEmailBodyEditor from 'src/components/notifications/NotifEmailBodyEditor.vue';
import { useAuthStore } from 'stores/auth';
import NotifRecipientTargeting, {
  type NotifRecipientMode,
} from 'src/components/notifications/NotifRecipientTargeting.vue';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const { t } = useI18n();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const formErrors = useFormFieldErrors();

const code = computed(() => decodeURIComponent(String(route.params.code || '')));

type TopicDetail = {
  code: string;
  kind: 'system' | 'manual';
  name: string;
  description: string | null;
  variableHelp: string;
  emailEnabled: boolean;
  appEnabled: boolean;
  emailRecipientMode: NotifRecipientMode;
  emailRecipientRoleIds: string[];
  appRecipientMode: NotifRecipientMode;
  appRecipientRoleIds: string[];
  emailSubject: string;
  emailBodyMarkdown: string;
  appTitleText: string;
  appBodyText: string;
  cronSchedule: string | null;
  cronPaused: boolean;
};

type CloudRole = { id: string; code: string; name: string };

const loading = ref(true);
const saving = ref(false);
const pushing = ref(false);
const error = ref('');
const detail = ref<TopicDetail | null>(null);
const roleOptions = ref<{ label: string; value: string }[]>([]);

const canUpdate = computed(() => auth.hasPermission('NOT::UPDATE'));

const isCompactActions = computed(() => !$q.screen.gt.sm);
const isEditorMobile = computed(() => !$q.screen.gt.sm);

const cronScheduleEnabled = computed({
  get: () => !form.value.cronPaused,
  set: (on: boolean) => {
    form.value.cronPaused = !on;
  },
});

function kindLabel(kind: string) {
  return kind === 'system' ? t('app.notif_kind_system') : t('app.notif_kind_manual');
}

const mdEditorId = computed(() => `notif-email-md-${code.value || 'topic'}`);

const variableHelpHtml = computed(() => {
  const raw = detail.value?.variableHelp?.trim() ?? '';
  if (!raw) return '';
  try {
    const html = marked.parse(raw, { async: false });
    return DOMPurify.sanitize(html);
  } catch {
    return '';
  }
});

const form = ref({
  name: '',
  description: '',
  emailEnabled: false,
  appEnabled: false,
  emailRecipientMode: 'ALL_USERS' as NotifRecipientMode,
  emailRecipientRoleIds: [] as string[],
  appRecipientMode: 'ALL_USERS' as NotifRecipientMode,
  appRecipientRoleIds: [] as string[],
  emailSubject: '',
  emailBodyMarkdown: '',
  appTitleText: '',
  appBodyText: '',
  cronSchedule: '',
  cronPaused: true,
});

type TopicFormState = typeof form.value;

const savedForm = ref<TopicFormState | null>(null);

function snapshotForm(source: TopicFormState): TopicFormState {
  return {
    ...source,
    emailRecipientRoleIds: [...source.emailRecipientRoleIds],
    appRecipientRoleIds: [...source.appRecipientRoleIds],
  };
}

function normalizeFormState(source: TopicFormState) {
  return {
    ...source,
    description: source.description.trim(),
    cronSchedule: source.cronSchedule.trim(),
    emailRecipientRoleIds: [...source.emailRecipientRoleIds].sort(),
    appRecipientRoleIds: [...source.appRecipientRoleIds].sort(),
  };
}

const isDirty = computed(() => {
  if (!savedForm.value || !canUpdate.value) return false;
  return (
    JSON.stringify(normalizeFormState(form.value)) !==
    JSON.stringify(normalizeFormState(savedForm.value))
  );
});

function peelCloudRolesPayload(raw: unknown): { roles: CloudRole[] } {
  const layer = raw as { roles?: CloudRole[]; data?: { roles?: CloudRole[] } };
  return (layer.data ?? layer) as { roles: CloudRole[] };
}

function normalizeRecipientMode(v: unknown): NotifRecipientMode {
  if (v === 'ROLE_GROUP' || v === 'ALL_EXCEPT_ROLES' || v === 'ALL_USERS') return v;
  return 'ALL_USERS';
}

function peelTopicPayload(raw: unknown): TopicDetail | null {
  const layer = raw as (TopicDetail & { data?: TopicDetail }) | null | undefined;
  if (!layer || typeof layer !== 'object') return null;
  const inner = (layer as TopicDetail & { data?: TopicDetail }).data ?? (layer as TopicDetail);
  if (!inner?.code) return null;
  return {
    ...inner,
    emailRecipientMode: normalizeRecipientMode(inner.emailRecipientMode),
    appRecipientMode: normalizeRecipientMode(inner.appRecipientMode),
    emailRecipientRoleIds: [...(inner.emailRecipientRoleIds || [])],
    appRecipientRoleIds: [...(inner.appRecipientRoleIds || [])],
  };
}

async function loadRoles() {
  const { data: body } = await http.get<ApiBody<{ roles: CloudRole[] }>>('/notifications/cloud-roles');
  const inner = peelCloudRolesPayload(unwrapData(body));
  roleOptions.value = (inner.roles ?? []).map((r) => ({
    label: `${r.name} (${r.code})`,
    value: r.id,
  }));
}

function applyDetail(d: TopicDetail) {
  detail.value = d;
  form.value = {
    name: d.name,
    description: d.description || '',
    emailEnabled: d.emailEnabled,
    appEnabled: d.appEnabled,
    emailRecipientMode: d.emailRecipientMode || 'ALL_USERS',
    emailRecipientRoleIds: [...(d.emailRecipientRoleIds || [])],
    appRecipientMode: d.appRecipientMode || 'ALL_USERS',
    appRecipientRoleIds: [...(d.appRecipientRoleIds || [])],
    emailSubject: d.emailSubject,
    emailBodyMarkdown: d.emailBodyMarkdown,
    appTitleText: d.appTitleText,
    appBodyText: d.appBodyText,
    cronSchedule: d.cronSchedule || '',
    cronPaused: d.cronPaused,
  };
  savedForm.value = snapshotForm(form.value);
}

async function loadDetail() {
  error.value = '';
  loading.value = true;
  if (!code.value.trim()) {
    error.value = t('app.notif_missing_code');
    detail.value = null;
    loading.value = false;
    return;
  }
  try {
    await loadRoles();
    const { data: body } = await http.get<ApiBody<TopicDetail>>(
      `/notifications/topics/${encodeURIComponent(code.value)}`,
    );
    const d = peelTopicPayload(unwrapData(body));
    if (!d) {
      error.value = t('app.notif_invalid_response');
      detail.value = null;
      return;
    }
    applyDetail(d);
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e);
    detail.value = null;
  } finally {
    loading.value = false;
  }
}

function buildPatchBody() {
  const base = {
    emailEnabled: form.value.emailEnabled,
    appEnabled: form.value.appEnabled,
    emailRecipientMode: form.value.emailRecipientMode,
    emailRecipientRoleIds: form.value.emailRecipientRoleIds,
    appRecipientMode: form.value.appRecipientMode,
    appRecipientRoleIds: form.value.appRecipientRoleIds,
    emailSubject: form.value.emailSubject,
    emailBodyMarkdown: form.value.emailBodyMarkdown,
    appTitleText: form.value.appTitleText,
    appBodyText: form.value.appBodyText,
  };
  if (detail.value?.kind === 'manual') {
    return {
      ...base,
      name: form.value.name,
      description: form.value.description || null,
      cronSchedule: form.value.cronSchedule.trim() || null,
      cronPaused: form.value.cronPaused,
    };
  }
  return base;
}

async function save() {
  if (!canUpdate.value) return;
  saving.value = true;
  error.value = '';
  formErrors.clear();
  if (detail.value?.kind === 'manual') {
    if (
      !runClientValidation(
        formErrors,
        notificationTopicManualSaveSchema(t, cronScheduleEnabled.value),
        { name: form.value.name, cronSchedule: form.value.cronSchedule },
        $q,
        t('app.account_generic_error'),
      )
    ) {
      saving.value = false;
      return;
    }
  }
  try {
    const { data: body } = await http.patch<ApiBody<TopicDetail>>(
      `/notifications/topics/${encodeURIComponent(code.value)}`,
      buildPatchBody(),
    );
    const d = peelTopicPayload(unwrapData(body));
    if (d) applyDetail(d);
    $q.notify({ type: 'positive', message: t('success') });
  } catch (e: unknown) {
    const parsed = formErrors.applyFromUnknown(e);
    error.value = parsed.message;
    notifyApiError($q, parsed, t('app.account_generic_error'));
  } finally {
    saving.value = false;
  }
}

async function pushNow() {
  if (!canUpdate.value) return;
  if (isDirty.value) {
    $q.notify({ type: 'warning', message: t('app.notif_unsaved_before_push') });
    return;
  }
  pushing.value = true;
  try {
    const { data: body } = await http.post<ApiBody<{ ok: boolean; result?: { appSuccess?: boolean; emailSuccess?: boolean } }>>(
      `/notifications/topics/${encodeURIComponent(code.value)}/dispatch`,
    );
    const payload = unwrapData(body) as { ok?: boolean; result?: { appSuccess?: boolean; emailSuccess?: boolean } };
    const ok = payload?.result?.appSuccess || payload?.result?.emailSuccess;
    $q.notify({
      type: ok ? 'positive' : 'warning',
      message: ok ? t('app.notif_push_success') : t('app.notif_push_failed'),
    });
  } catch (e: unknown) {
    notifyApiError($q, parseApiError(e), t('app.notif_push_failed'));
  } finally {
    pushing.value = false;
  }
}

function confirmDelete() {
  $q.dialog({
    title: t('app.notif_delete_topic'),
    message: t('app.notif_confirm_delete_topic'),
    cancel: true,
    persistent: true,
  }).onOk(() => void deleteTopic());
}

async function deleteTopic() {
  try {
    await http.delete(`/notifications/topics/${encodeURIComponent(code.value)}`);
    $q.notify({ type: 'positive', message: t('success') });
    await router.push('/notifications/settings');
  } catch (e: unknown) {
    notifyApiError($q, parseApiError(e), t('app.account_generic_error'));
  }
}

onMounted(() => void loadDetail());

watch(code, () => void loadDetail());
</script>

<style scoped>
.notif-topic-detail-page {
  max-width: 100%;
  min-width: 0;
  overflow-x: clip;
}

.notif-topic-detail__content,
.notif-topic-detail__content :deep(.q-card),
.notif-topic-detail__content :deep(.q-card__section) {
  min-width: 0;
  max-width: 100%;
}

.notif-topic-detail__header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.notif-topic-detail__header-main {
  min-width: 0;
}

.notif-topic-detail__title {
  min-width: 0;
}

.notif-topic-detail__actions {
  justify-content: flex-end;
  flex-wrap: wrap;
}

.notif-variable-help-md {
  line-height: 1.55;
  overflow-x: auto;
  max-width: 100%;
}
.notif-variable-help-md :deep(p) {
  margin: 0 0 0.5em;
}
.notif-variable-help-md :deep(p:last-child) {
  margin-bottom: 0;
}
.notif-variable-help-md :deep(ul),
.notif-variable-help-md :deep(ol) {
  margin: 0.35em 0 0.65em;
  padding-left: 1.35rem;
}
.notif-variable-help-md :deep(li) {
  margin: 0.2em 0;
}
.notif-variable-help-md :deep(code) {
  font-size: 0.9em;
  padding: 0.1em 0.35em;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.06);
}
.notif-variable-help-md :deep(pre code) {
  display: block;
  padding: 0.75rem;
  overflow-x: auto;
  background: rgba(0, 0, 0, 0.05);
}
</style>
