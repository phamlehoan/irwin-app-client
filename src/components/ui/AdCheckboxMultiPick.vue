<template>
  <div class="ad-multi-pick">
    <div
      ref="fieldRef"
      class="ad-multi-pick__field"
      :class="{ 'ad-multi-pick__field--open': menuOpen, 'ad-multi-pick__field--disabled': disabled }"
      tabindex="0"
      role="combobox"
      :aria-expanded="menuOpen"
      @click="onFieldClick"
      @keydown.enter.prevent="openMenu"
      @keydown.space.prevent="openMenu"
    >
      <div v-if="menuOpen" class="ad-multi-pick__field-open row items-center no-wrap full-width">
        <q-input
          ref="filterInputRef"
          v-model="filterText"
          dense
          borderless
          class="col"
          :placeholder="searchPlaceholder || placeholder"
          @update:model-value="onFilterInput"
          @keydown.esc.stop="closeMenu"
        />
        <q-icon name="search" size="18px" color="grey-6" class="q-ml-xs" />
      </div>
      <div v-else class="ad-multi-pick__badges row items-center q-gutter-xs">
        <template v-if="pickedOptions.length">
          <span
            v-for="opt in pickedOptions"
            :key="opt.value"
            class="ad-multi-pick__chip"
          >
            <span class="ad-multi-pick__chip-label">{{ opt.label }}</span>
            <button
              v-if="!disabled"
              type="button"
              class="ad-multi-pick__chip-remove"
              aria-label="Remove"
              @click.stop="removeValue(opt.value)"
            >
              <q-icon name="close" size="12px" />
            </button>
          </span>
        </template>
        <span v-else class="ad-multi-pick__placeholder">{{ placeholder }}</span>
      </div>
      <q-icon
        name="expand_more"
        size="20px"
        color="grey-7"
        class="ad-multi-pick__chevron"
        :class="{ 'ad-multi-pick__chevron--open': menuOpen }"
      />
    </div>

    <q-menu
      :model-value="menuOpen"
      :target="fieldRef ?? undefined"
      anchor="bottom left"
      self="top left"
      :offset="[0, 6]"
      fit
      no-focus
      no-parent-event
      content-class="ad-multi-pick__menu-shell"
      @update:model-value="onMenuToggle"
    >
      <div class="ad-multi-pick__dropdown">
        <div v-if="filteredOptions.length === 0" class="ad-multi-pick__dropdown-empty">
          {{ emptyOptionsText || '—' }}
        </div>
        <button
          v-for="opt in filteredOptions"
          :key="opt.value"
          type="button"
          class="ad-multi-pick__option"
          :class="{ 'ad-multi-pick__option--selected': isSelected(opt.value) }"
          @click="toggleValue(opt.value)"
        >
          <span class="ad-multi-pick__option-check" aria-hidden="true">
            <q-icon v-if="isSelected(opt.value)" name="check" size="14px" />
          </span>
          <span class="ad-multi-pick__option-main">
            <span class="ad-multi-pick__option-label">{{ opt.label }}</span>
            <span v-if="opt.caption" class="ad-multi-pick__option-code">{{ opt.caption }}</span>
          </span>
          <span v-if="$slots['option-side']" class="ad-multi-pick__option-side">
            <slot name="option-side" :option="opt" />
          </span>
        </button>
      </div>
    </q-menu>

    <template v-if="!hideAssignedList">
      <div v-if="listLabel" class="ad-multi-pick__list-label q-mt-md">{{ listLabel }}</div>

      <div v-if="listRows.length" class="ad-multi-pick__assigned q-mt-xs" :class="assignedGridClass">
      <div
        v-if="listPrimaryHeader || listSecondaryHeader || slots['list-side']"
        class="ad-multi-pick__assigned-head"
      >
        <span v-if="listPrimaryHeader">{{ listPrimaryHeader }}</span>
        <span v-if="listSecondaryHeader">{{ listSecondaryHeader }}</span>
        <span v-if="slots['list-side']" class="ad-multi-pick__assigned-head-action" />
      </div>
      <div class="ad-multi-pick__assigned-body">
        <div
          v-for="row in paginatedListRows"
          :key="row.value"
          class="ad-multi-pick__assigned-row"
        >
          <div class="ad-multi-pick__assigned-cell ad-multi-pick__assigned-cell--primary">
            {{ row.label }}
          </div>
          <div
            v-if="listSecondaryHeader"
            class="ad-multi-pick__assigned-cell ad-multi-pick__assigned-cell--secondary"
          >
            <span v-if="row.caption" class="ad-multi-pick__assigned-code">{{ row.caption }}</span>
            <span v-else class="text-grey-5">—</span>
          </div>
          <div v-if="$slots['list-side']" class="ad-multi-pick__assigned-cell ad-multi-pick__assigned-cell--action">
            <slot name="list-side" :option="row" />
          </div>
        </div>
      </div>
      <AdTablePagination
        :pagination="listPagination"
        :pages-number="listPagesNumber"
        :is-first-page="listPagination.page <= 1"
        :is-last-page="listPagination.page >= listPagesNumber"
        :first-page="goListFirstPage"
        :prev-page="goListPrevPage"
        :next-page="goListNextPage"
        :last-page="goListLastPage"
        :rows-per-page-options="listRowsPerPageOptions"
        @change="onListPaginationChange"
      />
      </div>
      <div v-else-if="emptyListText" class="ad-multi-pick__empty text-grey-7 text-body2 q-mt-sm">
        {{ emptyListText }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useSlots, watch } from 'vue';
import type { QInput } from 'quasar';
import AdTablePagination from 'src/components/ui/AdTablePagination.vue';
import { applyAdTablePaginationChange } from 'src/composables/useAdTablePagination';
import type { AdTablePaginationChange } from 'src/composables/useAdTablePagination';

export type AdMultiPickOption = {
  value: string;
  label: string;
  caption?: string;
};

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    options: AdMultiPickOption[];
    /** Danh sách đã gán — nếu không truyền sẽ lấy từ modelValue. */
    listItems?: AdMultiPickOption[];
    listLabel?: string;
    listPrimaryHeader?: string;
    listSecondaryHeader?: string;
    listPageSize?: number;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyListText?: string;
    emptyOptionsText?: string;
    disabled?: boolean;
    filterable?: boolean;
    /** Ẩn bảng danh sách đã gán — chỉ giữ input/badge picker. */
    hideAssignedList?: boolean;
  }>(),
  {
    listLabel: '',
    listPrimaryHeader: '',
    listSecondaryHeader: '',
    listPageSize: 5,
    placeholder: '',
    searchPlaceholder: '',
    emptyListText: '',
    emptyOptionsText: '',
    disabled: false,
    filterable: true,
    hideAssignedList: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
  search: [query: string];
}>();

const slots = useSlots();

const menuOpen = ref(false);
const filterText = ref('');
const fieldRef = ref<HTMLElement | null>(null);
const filterInputRef = ref<QInput | null>(null);

const listRowsPerPageOptions = [5, 10, 20];
const listPagination = ref({ page: 1, rowsPerPage: props.listPageSize, rowsNumber: 0 });

const optionByValue = computed(() => {
  const map = new Map<string, AdMultiPickOption>();
  for (const o of props.options) map.set(o.value, o);
  if (props.listItems) {
    for (const o of props.listItems) map.set(o.value, o);
  }
  return map;
});

const pickedOptions = computed(() =>
  props.modelValue
    .map((id) => optionByValue.value.get(id))
    .filter((o): o is AdMultiPickOption => Boolean(o)),
);

const listRows = computed(() => {
  if (props.listItems !== undefined) return props.listItems;
  return pickedOptions.value;
});

const paginatedListRows = computed(() => {
  const all = listRows.value;
  const page = listPagination.value.page;
  const per = listPagination.value.rowsPerPage;
  const start = (page - 1) * per;
  return all.slice(start, start + per);
});

const listPagesNumber = computed(() =>
  Math.max(1, Math.ceil(listRows.value.length / listPagination.value.rowsPerPage)),
);

const assignedGridClass = computed(() => {
  const hasSecondary = Boolean(props.listSecondaryHeader);
  const hasAction = Boolean(slots['list-side']);
  if (hasSecondary && hasAction) return 'ad-multi-pick__assigned--cols-3';
  if (hasSecondary) return 'ad-multi-pick__assigned--cols-2';
  if (hasAction) return 'ad-multi-pick__assigned--cols-2-action';
  return 'ad-multi-pick__assigned--cols-1';
});

const filteredOptions = computed(() => {
  const q = props.filterable ? filterText.value.trim().toLowerCase() : '';
  if (!q) return props.options;
  return props.options.filter(
    (o) =>
      o.label.toLowerCase().includes(q) ||
      (o.caption || '').toLowerCase().includes(q) ||
      o.value.toLowerCase().includes(q),
  );
});

function isSelected(value: string) {
  return props.modelValue.includes(value);
}

function toggleValue(value: string) {
  if (props.disabled) return;
  const next = isSelected(value)
    ? props.modelValue.filter((id) => id !== value)
    : [...props.modelValue, value];
  emit('update:modelValue', next);
}

function removeValue(value: string) {
  if (props.disabled) return;
  emit(
    'update:modelValue',
    props.modelValue.filter((id) => id !== value),
  );
}

function openMenu() {
  if (props.disabled) return;
  menuOpen.value = true;
  void nextTick(() => {
    filterInputRef.value?.focus();
  });
}

function closeMenu() {
  menuOpen.value = false;
}

function onFieldClick() {
  if (menuOpen.value) return;
  openMenu();
}

function onMenuToggle(open: boolean) {
  menuOpen.value = open;
  if (!open) {
    filterText.value = '';
  }
}

function onFilterInput(val: string | number | null) {
  emit('search', String(val ?? ''));
}

function onListPaginationChange(payload?: AdTablePaginationChange) {
  applyAdTablePaginationChange(listPagination, payload);
}

function goListFirstPage() {
  listPagination.value.page = 1;
}

function goListPrevPage() {
  listPagination.value.page = Math.max(1, listPagination.value.page - 1);
}

function goListNextPage() {
  listPagination.value.page = Math.min(listPagesNumber.value, listPagination.value.page + 1);
}

function goListLastPage() {
  listPagination.value.page = listPagesNumber.value;
}

watch(
  () => listRows.value.length,
  (count) => {
    listPagination.value.rowsNumber = count;
    const maxPage = Math.max(1, Math.ceil(count / listPagination.value.rowsPerPage));
    if (listPagination.value.page > maxPage) {
      listPagination.value.page = maxPage;
    }
  },
  { immediate: true },
);

watch(menuOpen, (open) => {
  if (open) {
    void nextTick(() => filterInputRef.value?.focus());
  }
});
</script>

<style scoped lang="scss">
@import 'src/css/brand.scss';

.ad-multi-pick__list-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
}

.ad-multi-pick__field {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-height: 40px;
  padding: 6px 10px;
  border: 1px solid $ad-topbar-border;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover:not(&--disabled) {
    border-color: #cbd5e1;
  }

  &--open {
    border-color: $ad-blue;
    box-shadow: 0 0 0 3px rgba($ad-blue, 0.12);
  }

  &--disabled {
    opacity: 0.65;
    cursor: not-allowed;
    background: #f8fafc;
  }
}

.ad-multi-pick__field-open {
  min-height: 28px;
}

.ad-multi-pick__badges {
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
  padding: 2px 0;
  gap: 6px;
}

.ad-multi-pick__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 3px 8px 3px 10px;
  border-radius: 999px;
  background: rgba($ad-blue, 0.08);
  border: 1px solid rgba($ad-blue, 0.18);
  color: $ad-blue-dark;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.3;
}

.ad-multi-pick__chip-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ad-multi-pick__chip-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  color: rgba($ad-blue-dark, 0.65);
  cursor: pointer;
  border-radius: 999px;
  line-height: 0;

  &:hover {
    color: $ad-blue-dark;
    background: rgba($ad-blue, 0.12);
  }
}

.ad-multi-pick__placeholder {
  color: #94a3b8;
  font-size: 0.875rem;
  line-height: 28px;
}

.ad-multi-pick__chevron {
  flex-shrink: 0;
  margin-top: 4px;
  transition: transform 0.15s ease;

  &--open {
    transform: rotate(180deg);
  }
}

:deep(.ad-multi-pick__menu-shell) {
  border-radius: 10px;
  border: 1px solid $ad-topbar-border;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
  overflow: hidden;
}

.ad-multi-pick__dropdown {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 280px;
  max-width: 100%;
  max-height: 280px;
  overflow-y: auto;
  padding: 6px;
  background: #fff;
}

.ad-multi-pick__dropdown-empty {
  padding: 16px 12px;
  text-align: center;
  font-size: 0.8125rem;
  color: #94a3b8;
}

.ad-multi-pick__option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;

  &:hover {
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  &--selected {
    background: rgba($ad-blue, 0.06);
    border-color: rgba($ad-blue, 0.22);

    &:hover {
      background: rgba($ad-blue, 0.1);
      border-color: rgba($ad-blue, 0.3);
    }

    .ad-multi-pick__option-check {
      background: $ad-blue;
      border-color: $ad-blue;
      color: #fff;
    }

    .ad-multi-pick__option-label {
      color: $ad-blue-dark;
      font-weight: 600;
    }
  }
}

.ad-multi-pick__option-check {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 1.5px solid #cbd5e1;
  border-radius: 5px;
  background: #fff;
  color: #fff;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.ad-multi-pick__option-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ad-multi-pick__option-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
  line-height: 1.3;
}

.ad-multi-pick__option-code {
  display: inline-flex;
  align-self: flex-start;
  padding: 1px 6px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  line-height: 1.4;
}

.ad-multi-pick__option-side {
  flex-shrink: 0;
}

.ad-multi-pick__assigned {
  border: 1px solid $ad-topbar-border;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
}

.ad-multi-pick__assigned-head {
  display: grid;
  gap: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid $ad-topbar-border;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.ad-multi-pick__assigned--cols-1 .ad-multi-pick__assigned-head,
.ad-multi-pick__assigned--cols-1 .ad-multi-pick__assigned-row {
  grid-template-columns: 1fr;
}

.ad-multi-pick__assigned--cols-2 .ad-multi-pick__assigned-head,
.ad-multi-pick__assigned--cols-2 .ad-multi-pick__assigned-row {
  grid-template-columns: 1fr 1fr;
}

.ad-multi-pick__assigned--cols-2-action .ad-multi-pick__assigned-head,
.ad-multi-pick__assigned--cols-2-action .ad-multi-pick__assigned-row {
  grid-template-columns: 1fr auto;
}

.ad-multi-pick__assigned--cols-3 .ad-multi-pick__assigned-head,
.ad-multi-pick__assigned--cols-3 .ad-multi-pick__assigned-row {
  grid-template-columns: 1fr 1fr auto;
}

.ad-multi-pick__assigned-head-action {
  width: 40px;
}

.ad-multi-pick__assigned-body {
  display: flex;
  flex-direction: column;
}

.ad-multi-pick__assigned-row {
  display: grid;
  gap: 12px;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.12s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #fafbfc;
  }
}

.ad-multi-pick__assigned-cell {
  min-width: 0;
  font-size: 0.875rem;
  color: #334155;

  &--primary {
    font-weight: 500;
  }

  &--secondary {
    color: #64748b;
  }

  &--action {
    display: flex;
    justify-content: flex-end;
    width: 40px;
  }
}

.ad-multi-pick__assigned-code {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.ad-multi-pick__empty {
  padding: 12px 14px;
  border: 1px dashed #e2e8f0;
  border-radius: 8px;
  background: #fafbfc;
  text-align: center;
}
</style>
