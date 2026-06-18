<template>
  <table class="ad-perm-matrix">
    <thead>
      <tr>
        <th>{{ t('app.permissions') }}</th>
        <th v-for="action in actions" :key="action">{{ colLabel(action) }}</th>
      </tr>
    </thead>
    <tbody>
      <template v-for="group in groups" :key="group.id">
        <tr v-if="group.isGroup" class="ad-perm-matrix__group">
          <td :colspan="actions.length + 1">{{ group.name }}</td>
        </tr>
        <tr v-for="row in group.rows" :key="row.featureId">
          <td>{{ row.name }}</td>
          <td v-for="action in actions" :key="action" class="text-center">
            <span v-if="!row.cells[action]" class="ad-perm-dot ad-perm-dot--na">—</span>
            <button
              v-else
              type="button"
              class="ad-perm-toggle"
              :disabled="readonly"
              :aria-label="row.cells[action]!.code"
              @click="toggle(row.cells[action]!.id)"
            >
              <span
                class="ad-perm-dot"
                :class="selectedIds.includes(row.cells[action]!.id) ? 'ad-perm-dot--on' : 'ad-perm-dot--off'"
              >
                <q-icon v-if="selectedIds.includes(row.cells[action]!.id)" name="check" size="14px" />
              </span>
            </button>
          </td>
        </tr>
      </template>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE'] as const;
type Action = (typeof ACTIONS)[number];

type Perm = { id: string; code: string };
type Feature = { id: string; name: string; permissions: Perm[] };

const props = defineProps<{
  features: Feature[];
  selectedIds: string[];
  readonly?: boolean;
  groupName?: string;
}>();

const emit = defineEmits<{ 'toggle-perm': [id: string, on: boolean] }>();

const { t } = useI18n();
const actions = ACTIONS;

function colLabel(action: Action): string {
  const map: Record<Action, string> = {
    CREATE: t('app.perm_col_create'),
    READ: t('app.perm_col_read'),
    UPDATE: t('app.perm_col_update'),
    DELETE: t('app.perm_col_delete'),
  };
  return map[action];
}

function actionOf(code: string): Action | null {
  const part = code.split('::').pop()?.toUpperCase();
  if (part && ACTIONS.includes(part as Action)) return part as Action;
  return null;
}

const groups = computed(() => {
  const rows = props.features.map((f) => {
    const cells: Partial<Record<Action, Perm>> = {};
    for (const p of f.permissions || []) {
      const a = actionOf(p.code);
      if (a) cells[a] = p;
    }
    return { featureId: f.id, name: f.name, cells };
  });
  return [
    {
      id: props.groupName || 'default',
      name: props.groupName || '',
      isGroup: Boolean(props.groupName),
      rows,
    },
  ];
});

function toggle(id: string) {
  if (props.readonly) return;
  const on = !props.selectedIds.includes(id);
  emit('toggle-perm', id, on);
}
</script>

<style scoped>
.ad-perm-toggle {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  line-height: 0;
}
.ad-perm-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
