<template>
  <q-page class="ad-page q-pa-lg">
    <div class="q-mb-lg">
      <div class="ad-page-title">{{ t('app.admin_users_title') }}</div>
      <div class="ad-page-subtitle">{{ t('app.dashboard_admin_users_hint') }}</div>
    </div>

    <q-banner v-if="error" class="bg-negative text-white q-mb-md" dense rounded>{{ error }}</q-banner>

    <div class="ad-table-card">
      <AdTableToolbar
        v-model:search="search"
        v-model:filter-values="filterValues"
        :filter-fields="filterFields"
        :loading="loading"
        :can-create="auth.hasPermission('USM::CREATE')"
        @refresh="reload"
        @create="openCreate"
        @search-change="onSearchChange"
        @filter-change="onFilterChange"
      />

      <q-table
        v-model:pagination="pagination"
        flat
        class="ad-data-table"
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 20, 50]"
        @request="onRequest"
      >
        <template #no-data>
          <AdTableNoData />
        </template>
        <template #body-cell-email="props">
          <q-td :props="props">
            <span class="ad-link" @click="openEdit(props.row as ApiUser)">{{ props.row.email }}</span>
          </q-td>
        </template>
        <template #body-cell-status="props">
          <q-td :props="props">
            <AdStatusBadge :status="String(props.row.status)" />
          </q-td>
        </template>
        <template #body-cell-roles="props">
          <q-td :props="props">
            <div v-if="props.row.roles.length" class="row q-gutter-xs">
              <AdRoleBadge v-for="r in props.row.roles" :key="r.id" :label="r.name" />
            </div>
            <span v-else class="text-grey-6">—</span>
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props" class="text-right">
            <div class="flex no-wrap items-center justify-end q-gutter-xs">
              <q-btn
                v-if="auth.hasPermission('USM::UPDATE')"
                flat
                dense
                color="primary"
                icon="edit_note"
                class="ad-icon-btn ad-icon-btn--sm"
                @click="openEdit(props.row as ApiUser)"
              />
              <q-btn
                v-if="auth.hasPermission('USM::UPDATE') && canQuickSetActive(props.row as ApiUser)"
                flat
                dense
                color="positive"
                icon="check_circle"
                class="ad-icon-btn ad-icon-btn--sm"
                :loading="statusUpdatingId === props.row.id"
                @click="setUserStatus(props.row as ApiUser, 'ACTIVE')"
              >
                <q-tooltip>{{ t('app.user_set_active') }}</q-tooltip>
              </q-btn>
              <q-btn
                v-if="auth.hasPermission('USM::UPDATE') && canQuickSetInactive(props.row as ApiUser)"
                flat
                dense
                color="negative"
                icon="block"
                class="ad-icon-btn ad-icon-btn--sm"
                :loading="statusUpdatingId === props.row.id"
                @click="setUserStatus(props.row as ApiUser, 'INACTIVE')"
              >
                <q-tooltip>{{ t('app.user_set_inactive') }}</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
        <template #bottom="scope">
          <AdTablePagination v-bind="scope" @change="onPaginationChange" />
        </template>
      </q-table>
    </div>

    <AdModal
      v-model="dlg.open"
      :title="dlg.isCreate ? t('app.user_create') : t('app.user_edit')"
      :subtitle="t('app.dashboard_admin_users_hint')"
      max-width="720px"
      :saving="saving"
      @save="save"
    >
      <div class="ad-modal-form-grid">
        <AdFormField :label="t('app.first_name')" required :error="formErrors.fieldError('firstName')">
          <q-input
            v-model="form.firstName"
            outlined
            dense
            hide-bottom-space
            :error="!!formErrors.fieldError('firstName')"
            :placeholder="t('app.first_name')"
          />
        </AdFormField>
        <AdFormField :label="t('app.last_name')" required :error="formErrors.fieldError('lastName')">
          <q-input
            v-model="form.lastName"
            outlined
            dense
            hide-bottom-space
            :error="!!formErrors.fieldError('lastName')"
            :placeholder="t('app.last_name')"
          />
        </AdFormField>
        <AdFormField :label="t('app.email')" required full :error="formErrors.fieldError('email')">
          <q-input
            v-model="form.email"
            outlined
            dense
            hide-bottom-space
            :error="!!formErrors.fieldError('email')"
            :placeholder="t('app.email')"
            :disable="!dlg.isCreate"
          />
        </AdFormField>
        <template v-if="!dlg.isCreate">
          <AdFormField :label="t('app.status')" full :error="formErrors.fieldError('status')">
            <div class="column q-gutter-sm">
              <div v-if="!canEditStatus" class="column q-gutter-xs">
                <AdStatusBadge :status="form.currentStatus" />
                <p v-if="isPendingStatus(form.currentStatus)" class="text-caption text-grey-7 q-mb-none">
                  {{ t('app.user_pending_status_hint') }}
                </p>
              </div>
              <template v-else>
                <div v-if="isRequestingStatus(form.currentStatus)" class="row items-center q-gutter-sm">
                  <span class="text-caption text-grey-7">{{ t('app.user_current_status') }}</span>
                  <AdStatusBadge :status="form.currentStatus" />
                </div>
                <AdStatusSelect
                  v-model="form.status"
                  :options="statusOptions"
                  :placeholder="t('app.user_status_placeholder')"
                />
              </template>
            </div>
          </AdFormField>
          <AdFormField v-if="canRequestPasswordReset" :label="t('app.user_password_actions')" full>
            <q-btn
              flat
              no-caps
              color="primary"
              icon="mail"
              class="ad-btn-outline"
              :loading="passwordResetting"
              :label="t('app.user_request_password_reset')"
              @click="requestPasswordReset"
            />
          </AdFormField>
        </template>
        <AdFormField v-if="canPickRoles" :label="t('app.col_roles')" full>
          <AdCheckboxMultiPick
            v-model="form.roleIds"
            hide-assigned-list
            :options="rolePickOptions"
            :placeholder="t('app.assign_picker_placeholder_roles')"
            :search-placeholder="t('app.assign_picker_search_roles')"
            :empty-options-text="t('app.assign_picker_no_options')"
          />
        </AdFormField>
      </div>
    </AdModal>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QTableColumn, QTableProps } from 'quasar';
import { useQuasar } from 'quasar';
import AdCheckboxMultiPick from 'src/components/ui/AdCheckboxMultiPick.vue';
import AdFormField from 'src/components/ui/AdFormField.vue';
import AdModal from 'src/components/ui/AdModal.vue';
import AdRoleBadge from 'src/components/ui/AdRoleBadge.vue';
import AdStatusBadge from 'src/components/ui/AdStatusBadge.vue';
import AdStatusSelect from 'src/components/ui/AdStatusSelect.vue';
import AdTablePagination from 'src/components/ui/AdTablePagination.vue';
import AdTableToolbar from 'src/components/ui/AdTableToolbar.vue';
import AdTableNoData from 'src/components/ui/AdTableNoData.vue';
import type { AdTableFilterField, AdTableFilterValues } from 'src/types/adTable';
import { applyAdTablePaginationChange } from 'src/composables/useAdTablePagination';
import type { AdTablePaginationChange } from 'src/composables/useAdTablePagination';
import { http } from 'src/api/http';
import { notifyApiError, parseApiError } from 'src/api/apiErrors';
import { unwrapData, type ApiBody } from 'src/api/unwrap';
import { useFormFieldErrors } from 'src/composables/useFormFieldErrors';
import { runClientValidation } from 'src/composables/useClientFormValidation';
import { adminUserCreateSchema, adminUserUpdateSchema } from 'src/validation/formSchemas';
import { useAuthStore } from 'stores/auth';

const { t } = useI18n();
const $q = useQuasar();
const auth = useAuthStore();
const formErrors = useFormFieldErrors();

type ApiUserRole = { id: string; code: string; name: string };

type ApiUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: ApiUserRole[];
};

type ApiUserRaw = Omit<ApiUser, 'roles'> & {
  roles?: { role?: ApiUserRole | null }[];
};

type ApiRoleOption = { id: string; code: string; name: string };

const canPickRoles = computed(() => auth.hasPermission('RAP::READ'));

const rolePickOptions = computed(() =>
  roleOptions.value.map((r) => ({
    value: r.id,
    label: r.name,
    caption: r.code,
  })),
);

const loading = ref(true);
const saving = ref(false);
const error = ref('');
const rows = ref<ApiUser[]>([]);
const roleOptions = ref<ApiRoleOption[]>([]);
const search = ref('');
const filterValues = ref<AdTableFilterValues>({ status: '' });

const filterFields = computed((): AdTableFilterField[] => [
  {
    key: 'status',
    label: t('app.status'),
    type: 'select',
    badge: 'status',
    options: [
      { label: t('app.status_all'), value: '' },
      { label: 'ACTIVE', value: 'ACTIVE' },
      { label: 'PENDING', value: 'PENDING' },
      { label: 'REQUESTING', value: 'REQUESTING' },
      { label: 'INACTIVE', value: 'INACTIVE' },
    ],
  },
]);

const pagination = ref<NonNullable<QTableProps['pagination']>>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

function tablePage() {
  return pagination.value.page ?? 1;
}

function tablePerPage() {
  return pagination.value.rowsPerPage ?? 10;
}

const columns: QTableColumn[] = [
  { name: 'email', field: 'email', label: t('app.email'), align: 'left' },
  { name: 'firstName', field: 'firstName', label: t('app.first_name'), align: 'left' },
  { name: 'lastName', field: 'lastName', label: t('app.last_name'), align: 'left' },
  { name: 'roles', field: 'roles', label: t('app.col_roles'), align: 'left' },
  { name: 'status', field: 'status', label: t('app.status'), align: 'left' },
  {
    name: 'actions',
    field: 'id',
    label: '',
    align: 'right',
    classes: 'text-right',
    headerClasses: 'text-right',
  },
];

const statusOptions = [
  { label: 'ACTIVE', value: 'ACTIVE' },
  { label: 'INACTIVE', value: 'INACTIVE' },
];

const passwordResetting = ref(false);
const statusUpdatingId = ref('');

const dlg = reactive({ open: false, isCreate: true, id: '' as string });
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  status: '',
  currentStatus: '',
  roleIds: [] as string[],
});

function isPendingStatus(status: string): boolean {
  return status.toUpperCase() === 'PENDING';
}

function isRequestingStatus(status: string): boolean {
  return status.toUpperCase() === 'REQUESTING';
}

function normalizeEditableStatus(status: string): string {
  const s = status.toUpperCase();
  return s === 'ACTIVE' || s === 'INACTIVE' ? s : '';
}

const canEditStatus = computed(
  () => !dlg.isCreate && !isPendingStatus(form.currentStatus),
);

const canRequestPasswordReset = computed(
  () => !dlg.isCreate && form.currentStatus.toUpperCase() === 'ACTIVE',
);

function canQuickSetActive(u: ApiUser): boolean {
  const s = u.status.toUpperCase();
  return s === 'INACTIVE' || s === 'REQUESTING';
}

function canQuickSetInactive(u: ApiUser): boolean {
  return u.status.toUpperCase() === 'ACTIVE';
}

async function setUserStatus(u: ApiUser, status: 'ACTIVE' | 'INACTIVE') {
  statusUpdatingId.value = u.id;
  error.value = '';
  try {
    await http.put(`/admin/users/${u.id}`, { status });
    await fetchPage(tablePage(), tablePerPage());
    $q.notify({
      type: 'positive',
      message:
        status === 'ACTIVE' ? t('app.user_set_active_ok') : t('app.user_set_inactive_ok'),
    });
  } catch (e: unknown) {
    const parsed = parseApiError(e);
    error.value = parsed.message;
    notifyApiError($q, parsed, t('app.account_generic_error'));
  } finally {
    statusUpdatingId.value = '';
  }
}

function mapUserRow(u: ApiUserRaw): ApiUser {
  const roles = (u.roles ?? [])
    .map((link) => link.role)
    .filter((r): r is ApiUserRole => Boolean(r?.id));
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    status: u.status,
    roles,
  };
}

async function loadRoles() {
  if (!canPickRoles.value) {
    roleOptions.value = [];
    return;
  }
  try {
    const { data: body } = await http.get<ApiBody<{ roles: ApiRoleOption[] }>>('/admin/roles', {
      params: { page: 1, perPage: 100 },
    });
    const inner = unwrapData(body);
    const list = inner.roles ?? [];
    roleOptions.value = list
      .filter((r) => r.id)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    roleOptions.value = [];
  }
}

async function fetchPage(p: number, per: number) {
  loading.value = true;
  error.value = '';
  try {
    const params: Record<string, string | number> = { page: p, perPage: per };
    const q = search.value.trim();
    if (q) params.search = q;
    const status = filterValues.value.status?.trim();
    if (status) params.filterStatus = status;

    const { data: body } = await http.get<
      ApiBody<{
        users: ApiUser[];
        total: number;
        page: number;
        perPage: number;
      }>
    >('/admin/users', { params });
    const pg = unwrapData(body);
    rows.value = (pg.users ?? []).map((u) => mapUserRow(u as ApiUserRaw));
    pagination.value = {
      ...pagination.value,
      page: pg.page ?? p,
      rowsPerPage: per,
      rowsNumber: pg.total ?? rows.value.length,
    };
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

function onSearchChange() {
  void fetchPage(1, tablePerPage());
}

function onFilterChange() {
  void fetchPage(1, tablePerPage());
}

function reload() {
  void fetchPage(tablePage(), tablePerPage());
}

function onPaginationChange(payload?: AdTablePaginationChange) {
  if (!payload) return;
  applyAdTablePaginationChange(pagination, payload);
  void fetchPage(
    payload.page ?? pagination.value.page ?? 1,
    payload.rowsPerPage ?? pagination.value.rowsPerPage ?? 10,
  );
}

function onRequest(req: Parameters<NonNullable<QTableProps['onRequest']>>[0]) {
  const { pagination: pg } = req;
  if (!pg) return;
  void fetchPage(pg.page, pg.rowsPerPage);
}

function openCreate() {
  dlg.isCreate = true;
  dlg.id = '';
  form.firstName = '';
  form.lastName = '';
  form.email = '';
  form.status = '';
  form.currentStatus = '';
  form.roleIds = [];
  formErrors.clear();
  dlg.open = true;
}

function openEdit(u: ApiUser) {
  dlg.isCreate = false;
  dlg.id = u.id;
  form.firstName = u.firstName || '';
  form.lastName = u.lastName || '';
  form.email = u.email || '';
  form.currentStatus = u.status || '';
  form.status = normalizeEditableStatus(u.status || '');
  form.roleIds = u.roles.map((r) => r.id);
  formErrors.clear();
  dlg.open = true;
}

async function requestPasswordReset() {
  if (!dlg.id || !canRequestPasswordReset.value) return;
  passwordResetting.value = true;
  try {
    const { data: body } = await http.post<
      ApiBody<{ ok: boolean; emailSent?: boolean; message?: string }>
    >(`/admin/users/${dlg.id}/request-password-reset`);
    const inner = unwrapData(body);
    $q.notify({
      type: inner.emailSent ? 'positive' : 'warning',
      message: inner.emailSent
        ? t('app.user_password_reset_requested')
        : t('app.user_password_reset_request_failed'),
    });
  } catch (e: unknown) {
    const parsed = parseApiError(e);
    notifyApiError($q, parsed, t('app.user_password_reset_request_failed'));
  } finally {
    passwordResetting.value = false;
  }
}

async function save() {
  saving.value = true;
  error.value = '';
  formErrors.clear();
  const schema = dlg.isCreate
    ? adminUserCreateSchema(t)
    : adminUserUpdateSchema(t, canEditStatus.value);
  if (
    !runClientValidation(
      formErrors,
      schema,
      {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        status: form.status,
      },
      $q,
      t('app.account_generic_error'),
    )
  ) {
    saving.value = false;
    return;
  }
  try {
    if (dlg.isCreate) {
      const { data: body } = await http.post<
        ApiBody<{ user: ApiUser; emailSent?: boolean }>
      >('/admin/users', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        ...(canPickRoles.value ? { roleIds: form.roleIds } : {}),
      });
      const inner = unwrapData(body);
      dlg.open = false;
      await fetchPage(tablePage(), tablePerPage());
      $q.notify({
        type: 'positive',
        message: inner.emailSent ? t('app.user_invite_sent') : t('app.user_saved'),
      });
    } else {
      const payload: Record<string, string | string[]> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
      };
      if (canEditStatus.value) {
        payload.status = form.status;
      }
      if (canPickRoles.value) {
        payload.roleIds = form.roleIds;
      }
      await http.put(`/admin/users/${dlg.id}`, payload);
      dlg.open = false;
      await fetchPage(tablePage(), tablePerPage());
      $q.notify({ type: 'positive', message: t('app.user_saved') });
    }
  } catch (e: unknown) {
    const parsed = formErrors.applyFromUnknown(e);
    error.value = parsed.message;
    notifyApiError($q, parsed, t('app.account_generic_error'));
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await loadRoles();
  await fetchPage(1, 10);
});
</script>
