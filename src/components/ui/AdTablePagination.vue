<template>
  <div class="ad-table-pagination">
    <div class="ad-table-pagination__summary">
      {{ summaryText }}
    </div>

    <div class="ad-table-pagination__nav row items-center no-wrap">
      <q-btn
        flat
        dense
        icon="first_page"
        class="ad-icon-btn ad-icon-btn--sm"
        :disable="isFirstPage"
        :aria-label="t('app.table_first_page')"
        @click="nav(firstPage)"
      />
      <q-btn
        flat
        dense
        icon="chevron_left"
        class="ad-icon-btn ad-icon-btn--sm"
        :disable="isFirstPage"
        :aria-label="t('app.table_prev_page')"
        @click="nav(prevPage)"
      />
      <div class="ad-table-pagination__pages row items-center no-wrap">
        <button
          v-for="p in visiblePages"
          :key="p"
          type="button"
          class="ad-table-pagination__page"
          :class="{ 'ad-table-pagination__page--active': p === pagination.page }"
          @click="goToPage(p)"
        >
          {{ p }}
        </button>
      </div>
      <q-btn
        flat
        dense
        icon="chevron_right"
        class="ad-icon-btn ad-icon-btn--sm"
        :disable="isLastPage"
        :aria-label="t('app.table_next_page')"
        @click="nav(nextPage)"
      />
      <q-btn
        flat
        dense
        icon="last_page"
        class="ad-icon-btn ad-icon-btn--sm"
        :disable="isLastPage"
        :aria-label="t('app.table_last_page')"
        @click="nav(lastPage)"
      />
    </div>

    <div class="ad-table-pagination__rows row items-center no-wrap">
      <span v-if="showRowsLabel" class="ad-table-pagination__label">{{ t('app.table_rows_per_page') }}</span>
      <q-select
        :model-value="pagination.rowsPerPage"
        dense
        outlined
        emit-value
        map-options
        :options="rowsPerPageOptions"
        class="ad-table-pagination__per-page"
        @update:model-value="onRowsPerPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { AdTablePaginationChange } from 'src/composables/useAdTablePagination';

const props = defineProps<{
  pagination: { page: number; rowsPerPage: number; rowsNumber?: number };
  pagesNumber: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  firstPage: () => void;
  prevPage: () => void;
  nextPage: () => void;
  lastPage: () => void;
  rowsPerPageOptions?: number[];
}>();

const emit = defineEmits<{ change: [payload?: AdTablePaginationChange] }>();

const { t } = useI18n();
const $q = useQuasar();

const rowsPerPageOptions = computed(() =>
  (props.rowsPerPageOptions ?? [10, 20, 50]).map((n) => ({ label: String(n), value: n })),
);

const showRowsLabel = computed(() => $q.screen.gt.sm);

const total = computed(() => props.pagination.rowsNumber ?? 0);

const summaryText = computed(() => {
  const totalRows = total.value;
  if (totalRows === 0) return t('app.table_showing_empty');
  const page = props.pagination.page;
  const per = props.pagination.rowsPerPage;
  const start = (page - 1) * per + 1;
  const end = Math.min(page * per, totalRows);
  if ($q.screen.gt.xs) {
    return t('app.table_showing_records', { start, end, total: totalRows });
  }
  return t('app.table_showing_records_short', { start, end, total: totalRows });
});

const visiblePages = computed(() => {
  const totalPages = Math.max(1, props.pagesNumber);
  const current = props.pagination.page;
  const maxButtons = $q.screen.gt.sm ? 5 : 3;
  if (totalPages <= maxButtons) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, totalPages, current]);
  if (current > 1) pages.add(current - 1);
  if (current < totalPages) pages.add(current + 1);
  return [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
});

function nav(fn: () => void) {
  fn();
}

function goToPage(page: number) {
  if (page === props.pagination.page) return;
  emit('change', { page, rowsPerPage: props.pagination.rowsPerPage });
}

function onRowsPerPage(val: number) {
  const rowsPerPage = Number(val);
  if (!rowsPerPage || rowsPerPage === props.pagination.rowsPerPage) return;
  emit('change', { page: 1, rowsPerPage });
}
</script>

<style scoped lang="scss">
@import 'src/css/brand.scss';

.ad-table-pagination {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  width: 100%;
  min-width: 0;
  gap: 8px 12px;
  padding: 8px 12px;
  border-top: 1px solid $ad-topbar-border;
  font-size: 0.8125rem;
  color: #64748b;
  box-sizing: border-box;
}

.ad-table-pagination__summary {
  flex: 1 1 0;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ad-table-pagination__nav {
  flex: 0 0 auto;
  gap: 4px;
}

.ad-table-pagination__rows {
  flex: 1 1 0;
  justify-content: flex-end;
  gap: 6px;
  min-width: 0;
}

.ad-table-pagination__label {
  white-space: nowrap;
}

.ad-table-pagination__per-page {
  width: 72px;

  :deep(.q-field__control) {
    min-height: 30px;
    padding: 0 8px;
  }

  :deep(.q-field__native) {
    min-height: 30px;
    padding: 0;
  }
}

.ad-table-pagination__pages {
  gap: 2px;
}

.ad-table-pagination__page {
  min-width: 30px;
  height: 30px;
  padding: 0 4px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #334155;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(&--active) {
    background: #f1f5f9;
  }

  &--active {
    background: $ad-blue;
    color: #fff;
    font-weight: 600;
  }
}

@media (min-width: 768px) {
  .ad-table-pagination {
    padding: 10px 16px;
    gap: 8px 20px;
  }

  .ad-table-pagination__nav {
    gap: 6px;
  }

  .ad-table-pagination__page {
    min-width: 32px;
    height: 32px;
    font-size: 0.875rem;
  }
}
</style>
