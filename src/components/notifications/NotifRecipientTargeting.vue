<template>
  <div class="column q-gutter-md">
    <q-option-group
      :model-value="mode"
      :options="modeOptions"
      :disable="disabled"
      type="radio"
      color="primary"
      inline
      class="notif-recipient-mode-group"
      @update:model-value="onModeChange"
    />
    <q-select
      v-if="showRolePicker"
      :model-value="roleIds"
      multiple
      use-chips
      outlined
      emit-value
      map-options
      :options="roleOptions"
      :disable="disabled"
      :label="roleLabel"
      :hint="roleHint"
      @update:model-value="emit('update:roleIds', ($event as string[]) || [])"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export type NotifRecipientMode = 'ALL_USERS' | 'ROLE_GROUP' | 'ALL_EXCEPT_ROLES';

const props = defineProps<{
  mode: NotifRecipientMode;
  roleIds: string[];
  roleOptions: { label: string; value: string }[];
  disabled?: boolean;
  roleLabel: string;
  roleHint: string;
}>();

const emit = defineEmits<{
  'update:mode': [value: NotifRecipientMode];
  'update:roleIds': [value: string[]];
}>();

const { t } = useI18n();

const modeOptions = computed(() => [
  { label: t('app.notif_recipient_all_users'), value: 'ALL_USERS' as const },
  { label: t('app.notif_recipient_role_group'), value: 'ROLE_GROUP' as const },
  {
    label: t('app.notif_recipient_all_except_roles'),
    value: 'ALL_EXCEPT_ROLES' as const,
  },
]);

const showRolePicker = computed(
  () => props.mode === 'ROLE_GROUP' || props.mode === 'ALL_EXCEPT_ROLES',
);

function normalizeRecipientMode(v: unknown): NotifRecipientMode {
  if (v === 'ROLE_GROUP' || v === 'ALL_EXCEPT_ROLES' || v === 'ALL_USERS') return v;
  return 'ALL_USERS';
}

function onModeChange(v: unknown) {
  emit('update:mode', normalizeRecipientMode(v));
}
</script>

<style scoped>
.notif-recipient-mode-group :deep(.q-radio) {
  margin-right: 0;
}
@media (max-width: 599px) {
  .notif-recipient-mode-group :deep(.q-option-group) {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
