<template>
  <q-page class="ad-page q-pa-lg">
    <div class="q-mb-lg">
      <div class="ad-page-title">{{ t('app.notif_settings_title') }}</div>
    </div>

    <q-banner v-if="error" class="bg-negative text-white q-mb-md" dense rounded>{{ error }}</q-banner>

    <div class="ad-table-card">
      <AdTableToolbar
        v-model:search="search"
        v-model:filter-values="filterValues"
        :filter-fields="filterFields"
        :loading="loading"
        :can-create="canUpdate"
        @refresh="load"
        @create="openCreate"
        @search-change="resetPage"
        @filter-change="resetPage"
      />

      <q-table
        v-if="!loading"
        flat
        class="ad-data-table"
        :rows="filteredRows"
        :columns="columns"
        row-key="code"
        v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 50]"
      >
        <template #no-data>
          <AdTableNoData />
        </template>
        <template #body-cell-kind="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.kind === 'system' ? 'blue-grey' : 'teal'"
              :label="kindLabel(props.row.kind)"
            />
          </q-td>
        </template>
        <template #body-cell-emailEnabled="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.emailEnabled ? 'positive' : 'grey'"
              :label="props.row.emailEnabled ? t('app.yes') : t('app.no')"
            />
          </q-td>
        </template>
        <template #body-cell-appEnabled="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.appEnabled ? 'positive' : 'grey'"
              :label="props.row.appEnabled ? t('app.yes') : t('app.no')"
            />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props" class="text-right">
            <div class="flex no-wrap items-center justify-end q-gutter-xs">
              <q-btn
                flat
                dense
                color="primary"
                icon="settings"
                class="ad-icon-btn ad-icon-btn--sm"
                :to="`/notifications/settings/${encodeURIComponent(props.row.code)}`"
              >
                <q-tooltip>{{ t('app.notif_detail') }}</q-tooltip>
              </q-btn>
              <q-btn
                v-if="canUpdate && props.row.kind === 'manual'"
                flat
                dense
                color="negative"
                icon="delete"
                class="ad-icon-btn ad-icon-btn--sm"
                @click="confirmDelete(props.row as TopicRow)"
              />
            </div>
          </q-td>
        </template>
        <template #bottom="scope">
          <AdTablePagination v-bind="scope" @change="onPaginationChange" />
        </template>
      </q-table>

      <div v-if="loading" class="flex flex-center q-py-xl">
        <q-spinner color="primary" size="2em" />
      </div>
    </div>

    <AdModal
      v-model="dlg.open"
      :title="t('app.notif_create_title')"
      max-width="560px"
      :saving="saving"
      @save="saveCreate"
    >
      <div class="ad-modal-form-grid">
        <AdFormField :label="t('app.notif_create_code')" required full :hint="t('app.notif_create_code_hint')" :error="createFormErrors.fieldError('code')">
          <q-input
            v-model="createForm.code"
            outlined
            dense
            hide-bottom-space
            :error="!!createFormErrors.fieldError('code')"
            @update:model-value="createForm.code = String($event || '').toUpperCase()"
          />
        </AdFormField>
        <AdFormField :label="t('app.notif_create_name')" required full :error="createFormErrors.fieldError('name')">
          <q-input
            v-model="createForm.name"
            outlined
            dense
            hide-bottom-space
            :error="!!createFormErrors.fieldError('name')"
          />
        </AdFormField>
        <AdFormField :label="t('app.notif_create_description')" full :error="createFormErrors.fieldError('description')">
          <AdTextarea v-model="createForm.description" :error="createFormErrors.fieldError('description')" />
        </AdFormField>
      </div>
    </AdModal>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import AdTablePagination from 'src/components/ui/AdTablePagination.vue';
import { applyAdTablePaginationChange } from 'src/composables/useAdTablePagination';
import type { AdTablePaginationChange } from 'src/composables/useAdTablePagination';
import AdTableToolbar from 'src/components/ui/AdTableToolbar.vue';
import AdTableNoData from 'src/components/ui/AdTableNoData.vue';
import AdModal from 'src/components/ui/AdModal.vue';
import AdFormField from 'src/components/ui/AdFormField.vue';
import AdTextarea from 'src/components/ui/AdTextarea.vue';
import type { AdTableFilterField, AdTableFilterValues } from 'src/types/adTable';
import { http } from 'src/api/http';
import { notifyApiError, parseApiError } from 'src/api/apiErrors';
import { unwrapData, type ApiBody } from 'src/api/unwrap';
import { useFormFieldErrors } from 'src/composables/useFormFieldErrors';
import { runClientValidation } from 'src/composables/useClientFormValidation';
import { notificationTopicCreateSchema } from 'src/validation/formSchemas';
import { formatDateTime } from 'src/utils/dateDisplay';
import { useAuthStore } from 'stores/auth';

const { t, locale } = useI18n();
const $q = useQuasar();
const auth = useAuthStore();
const createFormErrors = useFormFieldErrors();

const canUpdate = computed(() => auth.hasPermission('NOT::UPDATE'));

type TopicRow = {
  id: string;
  code: string;
  kind: 'system' | 'manual';
  name: string;
  description: string | null;
  emailEnabled: boolean;
  appEnabled: boolean;
  updatedAt: string | null;
};

const loading = ref(true);
const saving = ref(false);
const error = ref('');
const rows = ref<TopicRow[]>([]);
const search = ref('');
const filterValues = ref<AdTableFilterValues>({ channel: '', kind: '' });
const pagination = ref({ page: 1, rowsPerPage: 10, rowsNumber: 0 });

const dlg = ref({ open: false });
const createForm = ref({ code: '', name: '', description: '' });

function kindLabel(kind: string) {
  return kind === 'system' ? t('app.notif_kind_system') : t('app.notif_kind_manual');
}

const filterFields = computed((): AdTableFilterField[] => [
  {
    key: 'kind',
    label: t('app.notif_col_kind'),
    type: 'select',
    options: [
      { label: t('app.status_all'), value: '' },
      { label: t('app.notif_kind_system'), value: 'system' },
      { label: t('app.notif_kind_manual'), value: 'manual' },
    ],
  },
  {
    key: 'channel',
    label: t('app.notif_filter_channel'),
    type: 'select',
    options: [
      { label: t('app.status_all'), value: '' },
      { label: t('app.notif_col_email'), value: 'email' },
      { label: t('app.notif_col_app'), value: 'app' },
    ],
  },
]);

const filteredRows = computed(() => {
  let list = rows.value;
  const q = search.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q),
    );
  }
  const kind = filterValues.value.kind;
  if (kind === 'system' || kind === 'manual') {
    list = list.filter((r) => r.kind === kind);
  }
  const ch = filterValues.value.channel;
  if (ch === 'email') list = list.filter((r) => r.emailEnabled);
  else if (ch === 'app') list = list.filter((r) => r.appEnabled);
  return list;
});

const columns = computed((): QTableColumn[] => {
  const loc = locale.value;
  return [
    { name: 'code', field: 'code', label: 'Code', align: 'left' },
    { name: 'kind', field: 'kind', label: t('app.notif_col_kind'), align: 'left' },
    { name: 'name', field: 'name', label: t('app.col_name'), align: 'left' },
    { name: 'emailEnabled', field: 'emailEnabled', label: t('app.notif_col_email'), align: 'center' },
    { name: 'appEnabled', field: 'appEnabled', label: t('app.notif_col_app'), align: 'center' },
    {
      name: 'updatedAt',
      field: 'updatedAt',
      label: t('app.notif_col_updated'),
      align: 'left',
      format: (v: string | null) => (v ? formatDateTime(v, loc) : '—'),
    },
    { name: 'actions', field: 'code', label: '', align: 'right' },
  ];
});

watch(
  filteredRows,
  (list) => {
    pagination.value = { ...pagination.value, rowsNumber: list.length };
  },
  { immediate: true },
);

function resetPage() {
  pagination.value.page = 1;
}

function onPaginationChange(payload?: AdTablePaginationChange) {
  applyAdTablePaginationChange(pagination, payload);
}

function openCreate() {
  createForm.value = { code: '', name: '', description: '' };
  createFormErrors.clear();
  dlg.value.open = true;
}

async function saveCreate() {
  saving.value = true;
  error.value = '';
  createFormErrors.clear();
  if (
    !runClientValidation(
      createFormErrors,
      notificationTopicCreateSchema(t),
      createForm.value,
      $q,
      t('app.account_generic_error'),
    )
  ) {
    saving.value = false;
    return;
  }
  try {
    await http.post('/notifications/topics', { ...createForm.value });
    dlg.value.open = false;
    $q.notify({ type: 'positive', message: t('success') });
    await load();
  } catch (e: unknown) {
    const parsed = createFormErrors.applyFromUnknown(e);
    notifyApiError($q, parsed, t('app.account_generic_error'));
  } finally {
    saving.value = false;
  }
}

function confirmDelete(row: TopicRow) {
  $q.dialog({
    title: t('app.notif_delete_topic'),
    message: t('app.notif_confirm_delete_topic'),
    cancel: true,
    persistent: true,
  }).onOk(() => void deleteTopic(row.code));
}

async function deleteTopic(code: string) {
  try {
    await http.delete(`/notifications/topics/${encodeURIComponent(code)}`);
    $q.notify({ type: 'positive', message: t('success') });
    await load();
  } catch (e: unknown) {
    notifyApiError($q, parseApiError(e), t('app.account_generic_error'));
  }
}

async function load() {
  error.value = '';
  loading.value = true;
  try {
    const { data: body } = await http.get<ApiBody<TopicRow[]>>('/notifications/topics');
    rows.value = unwrapData(body) ?? [];
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => void load());
</script>
