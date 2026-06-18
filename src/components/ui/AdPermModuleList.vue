<template>
  <div class="ad-perm-module-list">
    <div
      v-for="item in items"
      :key="item.id"
      class="ad-perm-module-list__item"
      :class="{
        'ad-perm-module-list__item--active': selectable && selectedId === item.id,
        'ad-perm-module-list__item--partial': item.indeterminate,
        'ad-perm-module-list__item--granted':
          item.totalCount > 0 && item.selectedCount === item.totalCount,
      }"
    >
      <button
        type="button"
        class="ad-perm-module-list__check"
        :disabled="readonly || item.totalCount === 0"
        :aria-label="checkLabel(item)"
        @click.stop="emit('toggle', item.id, !item.checked)"
      >
        <span
          class="ad-perm-module-list__check-box"
          :class="{
            'ad-perm-module-list__check-box--on': item.checked,
            'ad-perm-module-list__check-box--partial': item.indeterminate,
            'ad-perm-module-list__check-box--disabled': readonly || item.totalCount === 0,
          }"
        >
          <q-icon v-if="item.checked" name="check" size="14px" />
          <q-icon v-else-if="item.indeterminate" name="remove" size="14px" />
        </span>
      </button>

      <button
        type="button"
        class="ad-perm-module-list__main"
        :disabled="!selectable"
        @click="onSelect(item.id)"
      >
        <span class="ad-perm-module-list__icon" aria-hidden="true">
          <q-icon name="view_module" size="18px" />
        </span>
        <span class="ad-perm-module-list__body">
          <span class="ad-perm-module-list__name">{{ item.name }}</span>
          <span class="ad-perm-module-list__meta">
            <span class="ad-perm-module-list__code">{{ item.code }}</span>
            <span
              class="ad-perm-module-list__count"
              :class="{
                'ad-perm-module-list__count--none': item.selectedCount === 0,
                'ad-perm-module-list__count--full':
                  item.totalCount > 0 && item.selectedCount === item.totalCount,
              }"
            >
              {{ countLabel(item) }}
            </span>
          </span>
        </span>
        <q-icon
          v-if="selectable"
          name="chevron_right"
          size="18px"
          class="ad-perm-module-list__arrow"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

export type PermModuleListItem = {
  id: string;
  code: string;
  name: string;
  totalCount: number;
  selectedCount: number;
  checked: boolean;
  indeterminate: boolean;
};

const props = defineProps<{
  items: PermModuleListItem[];
  selectedId?: string;
  selectable?: boolean;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  'update:selectedId': [id: string];
  toggle: [id: string, on: boolean];
}>();

const { t } = useI18n();

function countLabel(item: PermModuleListItem): string {
  return t('app.perm_module_count', {
    selected: item.selectedCount,
    total: item.totalCount,
  });
}

function checkLabel(item: PermModuleListItem): string {
  if (item.checked) return t('app.perm_module_uncheck', { name: item.name });
  return t('app.perm_module_check', { name: item.name });
}

function onSelect(id: string) {
  if (!props.selectable) return;
  emit('update:selectedId', id);
}
</script>
