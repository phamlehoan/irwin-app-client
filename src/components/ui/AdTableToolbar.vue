<template>
  <div
    class="ad-table-toolbar"
    :class="{ 'ad-table-toolbar--search-open': searchOpen && isMobile }"
  >
    <div class="ad-table-toolbar__main row items-center no-wrap">
      <q-btn
        v-if="isMobile && !searchOpen"
        flat
        dense
        class="ad-icon-btn ad-table-toolbar__search-toggle"
        icon="search"
        :aria-label="t('app.search')"
        @click="openSearch"
      />
      <q-input
        v-if="!isMobile || searchOpen"
        ref="searchInputRef"
        :model-value="search"
        dense
        outlined
        clearable
        class="ad-table-search"
        :class="{ 'ad-table-search--expanded': isMobile && searchOpen }"
        :placeholder="searchPlaceholder || t('app.search')"
        @update:model-value="onSearchInput"
        @blur="onSearchBlur"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>

      <q-space />

      <q-btn
        v-if="filterFields.length && (!isMobile || !searchOpen)"
        flat
        dense
        class="ad-icon-btn ad-table-toolbar__filter"
        :class="{ 'ad-icon-btn--active': activeFilterCount > 0 }"
        icon="filter_list"
        :aria-label="t('app.table_filter')"
        @click="openFilterDlg"
      >
        <q-badge v-if="activeFilterCount > 0" color="primary" floating rounded>{{ activeFilterCount }}</q-badge>
        <q-tooltip>{{ t('app.table_filter') }}</q-tooltip>
      </q-btn>

      <q-btn
        v-if="!isMobile || !searchOpen"
        flat
        dense
        class="ad-icon-btn q-ml-sm"
        icon="refresh"
        :loading="loading"
        :aria-label="t('app.refresh')"
        @click="$emit('refresh')"
      >
        <q-tooltip>{{ t('app.refresh') }}</q-tooltip>
      </q-btn>
      <q-btn
        v-if="canCreate && (!isMobile || !searchOpen)"
        unelevated
        no-caps
        color="primary"
        icon="add"
        :label="isMobile ? undefined : createLabel || t('app.new_record')"
        class="q-ml-sm ad-table-toolbar__create"
        @click="$emit('create')"
      />
    </div>

    <AdModal
      v-model="filterDlg"
      :title="t('app.table_filter_title')"
      max-width="480px"
      :save-label="t('app.table_filter_apply')"
      @save="applyFilters"
    >
      <template #footer>
        <q-btn flat no-caps color="primary" class="ad-btn-outline" :label="t('app.table_filter_clear')" @click="clearFilters" />
        <q-btn flat no-caps color="primary" class="ad-btn-outline" :label="t('app.cancel')" v-close-popup />
        <q-btn unelevated no-caps color="primary" :label="t('app.table_filter_apply')" @click="applyFilters" />
      </template>
      <div class="ad-modal-form-grid">
        <AdFormField
          v-for="field in filterFields"
          :key="field.key"
          :label="field.label"
          full
        >
          <AdStatusSelect
            v-if="field.type === 'select' && field.badge === 'status'"
            :model-value="draftValues[field.key] ?? ''"
            :options="field.options ?? []"
            :placeholder="field.label"
            @update:model-value="(v) => { draftValues[field.key] = v; }"
          />
          <q-select
            v-else-if="field.type === 'select'"
            v-model="draftValues[field.key]"
            outlined
            dense
            hide-bottom-space
            emit-value
            map-options
            :options="field.options ?? []"
            :placeholder="field.label"
          />
          <q-input
            v-else
            v-model="draftValues[field.key]"
            outlined
            dense
            hide-bottom-space
            clearable
            :placeholder="field.placeholder || field.label"
          />
        </AdFormField>
      </div>
    </AdModal>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar, type QInput } from 'quasar';
import AdFormField from 'src/components/ui/AdFormField.vue';
import AdModal from 'src/components/ui/AdModal.vue';
import AdStatusSelect from 'src/components/ui/AdStatusSelect.vue';
import type { AdTableFilterField, AdTableFilterValues } from 'src/types/adTable';

const props = withDefaults(
  defineProps<{
    search?: string;
    searchPlaceholder?: string;
    loading?: boolean;
    canCreate?: boolean;
    createLabel?: string;
    filterFields?: AdTableFilterField[];
    filterValues?: AdTableFilterValues;
  }>(),
  {
    search: '',
    loading: false,
    canCreate: false,
    createLabel: '',
    filterFields: () => [],
    filterValues: () => ({}),
  },
);

const emit = defineEmits<{
  'update:search': [value: string];
  'update:filterValues': [value: AdTableFilterValues];
  refresh: [];
  create: [];
  'search-change': [];
  'filter-change': [];
}>();

const { t } = useI18n();
const $q = useQuasar();

const searchOpen = ref(false);
const filterDlg = ref(false);
const searchInputRef = ref<QInput | null>(null);
const draftValues = reactive<AdTableFilterValues>({});

const isMobile = computed(() => !$q.screen.gt.sm);

const activeFilterCount = computed(() =>
  Object.values(props.filterValues).filter((v) => v && v !== 'ALL' && v.trim() !== '').length,
);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

function syncDraftFromProps() {
  for (const f of props.filterFields) {
    draftValues[f.key] = props.filterValues[f.key] ?? '';
  }
}

function openFilterDlg() {
  syncDraftFromProps();
  filterDlg.value = true;
}

function onSearchInput(val: string | number | null) {
  emit('update:search', String(val ?? ''));
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => emit('search-change'), 300);
}

async function openSearch() {
  searchOpen.value = true;
  await nextTick();
  searchInputRef.value?.focus();
}

function onSearchBlur() {
  if (!isMobile.value) return;
  setTimeout(() => {
    if (!props.search.trim()) searchOpen.value = false;
  }, 150);
}

function applyFilters() {
  const next: AdTableFilterValues = {};
  for (const f of props.filterFields) {
    next[f.key] = draftValues[f.key] ?? '';
  }
  emit('update:filterValues', next);
  emit('filter-change');
  filterDlg.value = false;
}

function clearFilters() {
  const cleared: AdTableFilterValues = {};
  for (const f of props.filterFields) cleared[f.key] = '';
  emit('update:filterValues', cleared);
  emit('filter-change');
  filterDlg.value = false;
}
</script>
