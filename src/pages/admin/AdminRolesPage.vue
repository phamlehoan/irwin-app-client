<template>
  <q-page class="ad-page q-pa-lg">
    <div class="q-mb-lg">
      <div class="ad-page-title">{{ t('app.admin_roles_title') }}</div>
      <div class="ad-page-subtitle">{{ t('app.dashboard_admin_roles_hint') }}</div>
    </div>

    <q-banner v-if="error" class="bg-negative text-white q-mb-md" dense rounded>{{ error }}</q-banner>

    <div class="ad-table-card">
      <AdTableToolbar
        v-model:search="search"
        v-model:filter-values="filterValues"
        :filter-fields="filterFields"
        :loading="loading"
        :can-create="auth.hasPermission('RAP::CREATE')"
        @refresh="reload"
        @create="openCreate"
        @search-change="resetPage"
        @filter-change="resetPage"
      />

      <q-table
        flat
        class="ad-data-table"
        :rows="filteredRows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 50]"
      >
      <template #no-data>
        <AdTableNoData />
      </template>
      <template #body-cell-description="props">
        <q-td :props="props">
          <span
            v-if="props.row.description"
            class="ad-role-desc-cell"
          >
            <q-tooltip v-if="props.row.description.length > 60" max-width="320px">
              {{ props.row.description }}
            </q-tooltip>
            {{ props.row.description }}
          </span>
          <span v-else class="text-grey-6">—</span>
        </q-td>
      </template>
      <template #body-cell-readOnly="props">
        <q-td :props="props">
          <q-badge v-if="props.row.isReadOnly" color="grey" :label="t('app.readonly')" />
          <span v-else>—</span>
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <div class="flex no-wrap items-center justify-end q-gutter-xs">
            <q-btn
              v-if="auth.hasPermission('RAP::UPDATE')"
              flat
              dense
              color="primary"
              icon="vpn_key"
              class="ad-icon-btn ad-icon-btn--sm"
              :disable="props.row.isReadOnly === true"
              @click="openPerm(props.row as ApiRole)"
            >
              <q-tooltip>{{ t('app.permissions') }}</q-tooltip>
            </q-btn>
            <q-btn
              v-if="auth.hasPermission('RAP::UPDATE')"
              flat
              dense
              color="secondary"
              icon="group_add"
              class="ad-icon-btn ad-icon-btn--sm"
              @click="openAssign(props.row as ApiRole)"
            >
              <q-tooltip>{{ t('app.assign_users') }}</q-tooltip>
            </q-btn>
            <q-btn
              v-if="auth.hasPermission('RAP::UPDATE')"
              flat
              dense
              color="primary"
              icon="edit"
              class="ad-icon-btn ad-icon-btn--sm"
              :disable="props.row.isReadOnly === true"
              @click="openEdit(props.row as ApiRole)"
            >
              <q-tooltip>{{ t('app.edit') }}</q-tooltip>
            </q-btn>
            <q-btn
              v-if="auth.hasPermission('RAP::DELETE')"
              flat
              dense
              color="negative"
              icon="delete"
              class="ad-icon-btn ad-icon-btn--sm"
              :disable="props.row.isReadOnly === true"
              @click="confirmDelete(props.row as ApiRole)"
            >
              <q-tooltip>{{ t('app.delete') }}</q-tooltip>
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
      v-model="dlgEdit.open"
      :title="dlgEdit.isCreate ? t('app.role_create') : t('app.role_edit')"
      max-width="520px"
      :saving="saving"
      @save="saveRole"
    >
      <div v-if="dlgEdit.loading" class="flex flex-center q-py-lg">
        <q-spinner color="primary" size="2em" />
      </div>
      <div v-else class="ad-modal-form-grid">
        <AdFormField :label="t('app.code')" required full :error="formErrors.fieldError('code')">
          <q-input
            v-model="form.code"
            outlined
            dense
            hide-bottom-space
            :error="!!formErrors.fieldError('code')"
            :placeholder="t('app.code')"
            :disable="!dlgEdit.isCreate"
          />
        </AdFormField>
        <AdFormField :label="t('app.name')" required full :error="formErrors.fieldError('name')">
          <q-input
            v-model="form.name"
            outlined
            dense
            hide-bottom-space
            :error="!!formErrors.fieldError('name')"
            :placeholder="t('app.name')"
          />
        </AdFormField>
        <AdFormField :label="t('app.description')" full :error="formErrors.fieldError('description')">
          <AdTextarea
            v-model="form.description"
            :placeholder="t('app.description')"
            :error="formErrors.fieldError('description')"
          />
        </AdFormField>
      </div>
    </AdModal>

    <q-dialog v-model="dlgPerm.open" class="ad-modal-dialog">
      <q-card class="ad-modal" style="width: min(960px, 96vw); max-width: 960px">
        <header class="ad-modal__header row items-center no-wrap">
          <h2 class="ad-modal__title col">{{ t('app.role_permissions') }}</h2>
          <q-btn flat dense icon="close" class="ad-icon-btn ad-icon-btn--sm ad-modal__close" v-close-popup />
        </header>
        <div class="ad-modal__body">
          <div class="row q-col-gutter-lg">
            <div class="col-12 col-md-4">
              <div class="ad-perm-panel__title">{{ t('app.perm_modules') }}</div>
              <p class="ad-perm-panel__hint">{{ t('app.perm_module_hint') }}</p>
              <AdPermModuleList
                v-model:selected-id="selectedMenuGroupId"
                :items="permModuleItems"
                :selectable="hasMenuGroups"
                :readonly="dlgPerm.isReadOnly"
                @toggle="onPermModuleToggle"
              />
            </div>
            <div class="col-12 col-md-8">
              <div class="ad-perm-panel__title">{{ t('app.perm_functions') }}</div>
              <p class="ad-perm-panel__hint">{{ t('app.perm_functions_hint') }}</p>
              <q-banner
                v-if="hasMenuGroups && !selectedMenuGroupId"
                dense
                rounded
                class="bg-grey-2 text-grey-8 q-mb-sm"
              >
                {{ t('app.perm_pick_module') }}
              </q-banner>
              <q-banner
                v-else-if="hasMenuGroups && featuresInSelectedGroup.length === 0"
                dense
                rounded
                class="bg-grey-2 text-grey-8 q-mb-sm"
              >
                {{ t('app.perm_no_child_features') }}
              </q-banner>
              <AdPermissionsMatrix
                v-else
                :features="rightPanelFeatures"
                :selected-ids="permForm.ids"
                :readonly="dlgPerm.isReadOnly"
                :group-name="selectedMenuGroupName"
                @toggle-perm="togglePerm"
              />
            </div>
          </div>
        </div>
        <footer class="ad-modal__footer row items-center justify-end q-gutter-sm">
          <q-btn flat no-caps class="ad-btn-outline" :label="t('app.cancel')" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="t('app.save')"
            :loading="saving"
            :disable="dlgPerm.isReadOnly"
            @click="savePerms"
          />
        </footer>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dlgAssign.open" class="ad-modal-dialog" @hide="onAssignDialogHide">
      <q-card class="ad-modal" style="width: min(640px, 96vw); max-width: 640px">
        <header class="ad-modal__header row items-center no-wrap">
          <div class="col min-w-0">
            <h2 class="ad-modal__title">{{ t('app.assign_users') }}</h2>
            <p v-if="assignRoleLabel" class="ad-modal__subtitle q-mb-none">{{ assignRoleLabel }}</p>
          </div>
          <q-btn flat dense icon="close" class="ad-icon-btn ad-icon-btn--sm ad-modal__close" v-close-popup />
        </header>
        <div class="ad-modal__body">
          <div v-if="assignPanelBusy" class="flex flex-center q-py-lg">
            <q-spinner color="primary" size="2em" />
          </div>
          <template v-else>
            <p class="text-caption text-grey-7 q-mb-sm">{{ t('app.role_assign_pick_hint') }}</p>
            <AdCheckboxMultiPick
              v-model="selectedCandidateIds"
              :list-items="assignedPickOptions"
              :options="candidatePickOptions"
              :filterable="false"
              :list-label="t('app.role_assigned_users')"
              :list-primary-header="t('app.email')"
              :list-secondary-header="t('app.name')"
              :placeholder="t('app.assign_picker_placeholder_users')"
              :search-placeholder="t('app.role_assign_search_placeholder')"
              :empty-list-text="t('app.role_assign_no_assigned')"
              :empty-options-text="t('app.role_assign_no_candidates')"
              @search="onAssignPickerSearch"
            >
              <template #list-side="{ option }">
                <q-btn
                  flat
                  dense
                  color="negative"
                  icon="person_off"
                  class="ad-icon-btn ad-icon-btn--sm"
                  :disable="cannotRemoveLastAssignee"
                  :loading="removingUserId === option.value"
                  @click.stop="removeUserFromRole(option.value)"
                >
                  <q-tooltip>
                    {{
                      cannotRemoveLastAssignee
                        ? t('app.role_cannot_remove_last_user')
                        : t('app.role_remove_user')
                    }}
                  </q-tooltip>
                </q-btn>
              </template>
              <template #option-side="{ option }">
                <AdStatusBadge
                  v-if="candidateUserById.get(option.value)"
                  :status="candidateUserById.get(option.value)!.status"
                />
              </template>
            </AdCheckboxMultiPick>
          </template>
        </div>
        <footer class="ad-modal__footer row items-center justify-end q-gutter-sm">
          <q-btn flat no-caps class="ad-btn-outline" :label="t('app.btn_close')" @click="dlgAssign.open = false" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="t('app.role_assign_submit', { count: selectedCandidateIds.length })"
            :loading="saving"
            :disable="selectedCandidateIds.length === 0"
            @click="submitAssignSelected"
          />
        </footer>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QTableColumn } from 'quasar';
import { useQuasar } from 'quasar';
import AdCheckboxMultiPick from 'src/components/ui/AdCheckboxMultiPick.vue';
import AdFormField from 'src/components/ui/AdFormField.vue';
import AdModal from 'src/components/ui/AdModal.vue';
import AdTextarea from 'src/components/ui/AdTextarea.vue';
import AdPermissionsMatrix from 'src/components/ui/AdPermissionsMatrix.vue';
import AdPermModuleList, { type PermModuleListItem } from 'src/components/ui/AdPermModuleList.vue';
import AdStatusBadge from 'src/components/ui/AdStatusBadge.vue';
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
import { adminRoleSchema } from 'src/validation/formSchemas';
import { useAuthStore } from 'stores/auth';

const { t } = useI18n();
const auth = useAuthStore();
const $q = useQuasar();
const formErrors = useFormFieldErrors();

type ApiRoleUserLink = {
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
  };
};

type ApiRole = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isReadOnly?: boolean;
  permissions?: { permission?: { id: string; code?: string }; permissionId?: string }[];
  users?: ApiRoleUserLink[];
};

type AssignedUserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
};

type ApiFeature = {
  id: string;
  code: string;
  name: string;
  type?: string;
  parentId?: string | null;
  sortOrder?: number;
  permissions: { id: string; code: string }[];
};

const loading = ref(true);
const saving = ref(false);
const error = ref('');
const rows = ref<ApiRole[]>([]);
const search = ref('');
const filterValues = ref<AdTableFilterValues>({ readOnly: '' });
const pagination = ref({ page: 1, rowsPerPage: 10, rowsNumber: 0 });

const filterFields = computed((): AdTableFilterField[] => [
  {
    key: 'readOnly',
    label: t('app.readonly'),
    type: 'select',
    options: [
      { label: t('app.status_all'), value: '' },
      { label: t('app.yes'), value: 'yes' },
      { label: t('app.no'), value: 'no' },
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
  const ro = filterValues.value.readOnly;
  if (ro === 'yes') list = list.filter((r) => r.isReadOnly);
  else if (ro === 'no') list = list.filter((r) => !r.isReadOnly);
  return list;
});

watch(
  filteredRows,
  (list) => {
    pagination.value.rowsNumber = list.length;
  },
  { immediate: true },
);

function resetPage() {
  pagination.value.page = 1;
}

function onPaginationChange(payload?: AdTablePaginationChange) {
  applyAdTablePaginationChange(pagination, payload);
}
const features = ref<ApiFeature[]>([]);

const columns: QTableColumn[] = [
  { name: 'code', field: 'code', label: t('app.code'), align: 'left' },
  { name: 'name', field: 'name', label: t('app.name'), align: 'left' },
  {
    name: 'description',
    field: 'description',
    label: t('app.description'),
    align: 'left',
    classes: 'ad-role-desc-col',
    headerClasses: 'ad-role-desc-col',
  },
  { name: 'readOnly', field: 'isReadOnly', label: '', align: 'center' },
  {
    name: 'actions',
    field: 'id',
    label: '',
    align: 'right',
    classes: 'text-right',
    headerClasses: 'text-right',
  },
];

const dlgEdit = reactive({ open: false, isCreate: true, id: '' as string, loading: false });
const form = reactive({ code: '', name: '', description: '' });

const dlgPerm = reactive({ open: false, id: '' as string, isReadOnly: false });
const permForm = reactive({ ids: [] as string[] });
const selectedMenuGroupId = ref('');

const dlgAssign = reactive({ open: false, id: '' as string, roleName: '', isReadOnly: false });
const assignForm = reactive({ userIds: [] as string[] });
const assignPanelBusy = ref(false);
const assignSearch = ref('');
const candidateUsers = ref<AssignedUserRow[]>([]);
const selectedCandidateIds = ref<string[]>([]);
const assignedUsers = ref<AssignedUserRow[]>([]);
const removingUserId = ref('');

const assignRoleLabel = computed(() => dlgAssign.roleName.trim());

const cannotRemoveLastAssignee = computed(
  () => dlgAssign.isReadOnly && assignedUsers.value.length <= 1,
);

const assignedPickOptions = computed(() =>
  assignedUsers.value.map((u) => ({
    value: u.id,
    label: u.email,
    caption: userDisplayName(u),
  })),
);

const candidatePickOptions = computed(() =>
  candidateUsers.value.map((u) => ({
    value: u.id,
    label: u.email,
    caption: userDisplayName(u),
  })),
);

const candidateUserById = computed(() => {
  const map = new Map<string, AssignedUserRow>();
  for (const u of candidateUsers.value) map.set(u.id, u);
  return map;
});

const childrenByParent = computed(() => {
  const m = new Map<string, ApiFeature[]>();
  for (const f of features.value) {
    if (!f.parentId) continue;
    const arr = m.get(f.parentId) ?? [];
    arr.push(f);
    m.set(f.parentId, arr);
  }
  return m;
});

function descendantsOfFeature(rootId: string): ApiFeature[] {
  const m = childrenByParent.value;
  const out: ApiFeature[] = [];
  const stack = [...(m.get(rootId) ?? [])];
  while (stack.length) {
    const f = stack.pop()!;
    out.push(f);
    for (const c of m.get(f.id) ?? []) stack.push(c);
  }
  return out;
}

function menuGroupPermIds(g: ApiFeature): string[] {
  const ids: string[] = [];
  for (const f of descendantsOfFeature(g.id)) {
    for (const p of f.permissions || []) ids.push(p.id);
  }
  return ids;
}

const menuGroups = computed(() =>
  features.value
    .filter((f) => f.type === 'MENU_GROUP')
    .sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.code.localeCompare(b.code),
    ),
);

const hasMenuGroups = computed(() => menuGroups.value.length > 0);

const selectedMenuGroupName = computed(() => {
  const g = menuGroups.value.find((x) => x.id === selectedMenuGroupId.value);
  return g?.name ?? '';
});

const featuresInSelectedGroup = computed(() => {
  if (!selectedMenuGroupId.value) return [];
  return features.value
    .filter(
      (f) =>
        f.parentId === selectedMenuGroupId.value && f.type !== 'MENU_GROUP',
    )
    .sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.code.localeCompare(b.code),
    );
});

const rightPanelFeatures = computed(() =>
  hasMenuGroups.value ? featuresInSelectedGroup.value : features.value,
);

function permSelectionStats(ids: string[]) {
  const totalCount = ids.length;
  const selectedCount = ids.filter((id) => permForm.ids.includes(id)).length;
  return {
    totalCount,
    selectedCount,
    checked: totalCount > 0 && selectedCount === totalCount,
    indeterminate: selectedCount > 0 && selectedCount < totalCount,
  };
}

const permModuleItems = computed((): PermModuleListItem[] => {
  const list = hasMenuGroups.value ? menuGroups.value : features.value;
  return list.map((f) => {
    const ids = hasMenuGroups.value ? menuGroupPermIds(f) : featurePermIds(f);
    return {
      id: f.id,
      code: f.code,
      name: f.name,
      ...permSelectionStats(ids),
    };
  });
});

function featurePermIds(f: ApiFeature): string[] {
  return (f.permissions || []).map((p) => p.id);
}

function onPermModuleToggle(id: string, on: boolean) {
  if (hasMenuGroups.value) {
    const g = menuGroups.value.find((x) => x.id === id);
    if (g) toggleMenuGroup(g, on);
    return;
  }
  const f = features.value.find((x) => x.id === id);
  if (f) toggleModule(f, on);
}

function toggleModule(f: ApiFeature, on: boolean) {
  const ids = featurePermIds(f);
  if (on) {
    permForm.ids = [...new Set([...permForm.ids, ...ids])];
  } else {
    permForm.ids = permForm.ids.filter((id) => !ids.includes(id));
  }
}

function toggleMenuGroup(g: ApiFeature, on: boolean) {
  const ids = menuGroupPermIds(g);
  if (on) {
    permForm.ids = [...new Set([...permForm.ids, ...ids])];
  } else {
    permForm.ids = permForm.ids.filter((id) => !ids.includes(id));
  }
}

function togglePerm(id: string, on: boolean) {
  if (on) {
    if (!permForm.ids.includes(id)) permForm.ids.push(id);
  } else {
    permForm.ids = permForm.ids.filter((x) => x !== id);
  }
}

function userDisplayName(u: Pick<AssignedUserRow, 'firstName' | 'lastName'>): string {
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—';
}

async function loadAssignCandidates() {
  if (!dlgAssign.id) {
    candidateUsers.value = [];
    return;
  }
  const { data: body } = await http.get<
    ApiBody<{
      usersToAssign: AssignedUserRow[];
    }>
  >(`/admin/roles/${dlgAssign.id}/assign-candidates`, {
    params: { search: assignSearch.value.trim() },
  });
  const inner = unwrapData(body);
  candidateUsers.value = inner.usersToAssign ?? [];
}

async function loadFeatures() {
  const { data: body } = await http.get<ApiBody<{ features: ApiFeature[] }>>('/admin/features');
  const inner = unwrapData(body);
  const arr = inner.features ?? (Array.isArray(inner) ? inner : []);
  features.value = Array.isArray(arr) ? arr : [];
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const { data: body } = await http.get<ApiBody<{ roles: ApiRole[] }>>('/admin/roles', {
      params: { page: 1, perPage: 100 },
    });
    const inner = unwrapData(body);
    const raw = inner.roles ?? (Array.isArray(inner) ? inner : []);
    rows.value = Array.isArray(raw) ? raw : [];
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

function pickRoleFromShowPayload(inner: { role?: ApiRole } | ApiRole): ApiRole {
  if (typeof inner === 'object' && inner !== null && 'role' in inner && inner.role) {
    return inner.role;
  }
  return inner as ApiRole;
}

async function fetchRoleDetail(roleId: string): Promise<ApiRole> {
  const { data: body } = await http.get<ApiBody<{ role: ApiRole }>>(`/admin/roles/${roleId}`);
  const inner = unwrapData(body);
  return pickRoleFromShowPayload(inner);
}

function reload() {
  void load();
}

function openCreate() {
  dlgEdit.isCreate = true;
  dlgEdit.id = '';
  form.code = '';
  form.name = '';
  form.description = '';
  formErrors.clear();
  dlgEdit.open = true;
}

function openEdit(r: ApiRole) {
  if (r.isReadOnly) return;
  dlgEdit.isCreate = false;
  dlgEdit.id = r.id;
  dlgEdit.open = true;
  dlgEdit.loading = true;
  form.code = r.code;
  form.name = r.name;
  form.description = '';
  formErrors.clear();
  void (async () => {
    try {
      const role = await fetchRoleDetail(r.id);
      form.code = role.code;
      form.name = role.name;
      form.description = role.description ?? '';
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      dlgEdit.open = false;
    } finally {
      dlgEdit.loading = false;
    }
  })();
}

async function saveRole() {
  saving.value = true;
  error.value = '';
  formErrors.clear();
  if (
    !runClientValidation(
      formErrors,
      adminRoleSchema(t),
      { code: form.code, name: form.name },
      $q,
      t('app.account_generic_error'),
    )
  ) {
    saving.value = false;
    return;
  }
  try {
    if (dlgEdit.isCreate) {
      await http.post('/admin/roles', {
        code: form.code,
        name: form.name,
        description: form.description || undefined,
      });
    } else {
      await http.put(`/admin/roles/${dlgEdit.id}`, {
        code: form.code,
        name: form.name,
        description: form.description || undefined,
      });
    }
    dlgEdit.open = false;
    await load();
    $q.notify({ type: 'positive', message: t('app.role_saved') });
  } catch (e: unknown) {
    const parsed = formErrors.applyFromUnknown(e);
    error.value = parsed.message;
    notifyApiError($q, parsed, t('app.account_generic_error'));
  } finally {
    saving.value = false;
  }
}

function joinRolePermissionIds(rows: ApiRole['permissions'] | undefined): string[] {
  const ids: string[] = [];
  for (const x of rows || []) {
    const row = x as { permission?: { id?: string }; permissionId?: string };
    const id = row.permission?.id ?? row.permissionId;
    if (id) ids.push(id);
  }
  return [...new Set(ids)];
}

async function openPerm(r: ApiRole) {
  if (r.isReadOnly) return;
  dlgPerm.id = r.id;
  dlgPerm.isReadOnly = !!r.isReadOnly;
  try {
    const role = await fetchRoleDetail(r.id);
    permForm.ids = joinRolePermissionIds(role.permissions);
    selectedMenuGroupId.value = menuGroups.value[0]?.id ?? '';
    dlgPerm.open = true;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function savePerms() {
  if (dlgPerm.isReadOnly) return;
  saving.value = true;
  error.value = '';
  try {
    await http.put(`/admin/roles/${dlgPerm.id}`, {
      permissionIds: permForm.ids,
    });
    dlgPerm.open = false;
    await load();
    $q.notify({ type: 'positive', message: t('app.role_perms_saved') });
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e);
    notifyApiError($q, parseApiError(e), t('app.account_generic_error'));
  } finally {
    saving.value = false;
  }
}

async function refreshAssignState(roleId: string) {
  const { data: body } = await http.get<
    ApiBody<{
      role: ApiRole;
      assignedUsers: { id: string; email: string; firstName: string; lastName: string; status: string }[];
    }>
  >(`/admin/roles/${roleId}`);
  const inner = unwrapData(body);
  const users = inner.assignedUsers ?? inner.role?.users?.map((x) => x.user) ?? [];
  assignForm.userIds = users.map((u) => u.id);
  assignedUsers.value = users.map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    status: u.status,
  }));
}

function onAssignDialogHide() {
  selectedCandidateIds.value = [];
  assignSearch.value = '';
  candidateUsers.value = [];
  assignedUsers.value = [];
  assignForm.userIds = [];
  dlgAssign.id = '';
  dlgAssign.roleName = '';
  dlgAssign.isReadOnly = false;
}

async function onAssignPickerSearch(query: string) {
  assignSearch.value = query;
  await loadAssignCandidates();
}

async function submitAssignSelected() {
  if (!dlgAssign.id || selectedCandidateIds.value.length === 0) return;
  saving.value = true;
  error.value = '';
  try {
    await http.post(`/admin/roles/${dlgAssign.id}/assign-users`, {
      userIds: selectedCandidateIds.value,
    });
    await refreshAssignState(dlgAssign.id);
    await loadAssignCandidates();
    selectedCandidateIds.value = [];
    await load();
    $q.notify({ type: 'positive', message: t('app.role_assign_saved') });
  } catch (e: unknown) {
    error.value = parseApiError(e).message;
    notifyApiError($q, parseApiError(e), t('app.account_generic_error'));
  } finally {
    saving.value = false;
  }
}

async function openAssign(r: ApiRole) {
  dlgAssign.id = r.id;
  dlgAssign.roleName = r.name;
  dlgAssign.isReadOnly = !!r.isReadOnly;
  dlgAssign.open = true;
  assignSearch.value = '';
  selectedCandidateIds.value = [];
  assignPanelBusy.value = true;
  error.value = '';
  try {
    await refreshAssignState(r.id);
    await loadAssignCandidates();
  } catch (e: unknown) {
    error.value = parseApiError(e).message;
    dlgAssign.open = false;
  } finally {
    assignPanelBusy.value = false;
  }
}

async function removeUserFromRole(userId: string) {
  removingUserId.value = userId;
  error.value = '';
  try {
    await http.delete(`/admin/roles/${dlgAssign.id}/users/${userId}`);
    await refreshAssignState(dlgAssign.id);
    await loadAssignCandidates();
    await load();
    $q.notify({ type: 'positive', message: t('app.role_user_removed') });
  } catch (e: unknown) {
    error.value = parseApiError(e).message;
    notifyApiError($q, parseApiError(e), t('app.account_generic_error'));
  } finally {
    removingUserId.value = '';
  }
}

function confirmDelete(r: ApiRole) {
  $q.dialog({
    title: t('app.confirm_delete'),
    message: r.code,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await http.delete(`/admin/roles/${r.id}`);
        await load();
        $q.notify({ type: 'positive', message: t('app.role_deleted_ok') });
      } catch (e: unknown) {
        const parsed = parseApiError(e);
        error.value = parsed.message;
        notifyApiError($q, parsed, t('app.account_generic_error'));
      }
    })();
  });
}

onMounted(async () => {
  await loadFeatures();
  await load();
});
</script>

<style scoped lang="scss">
.ad-role-desc-col {
  max-width: 280px;
  width: 35%;
}

.ad-role-desc-cell {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
