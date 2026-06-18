<template>
  <q-select
    class="ad-status-select"
    :model-value="modelValue"
    outlined
    dense
    hide-bottom-space
    emit-value
    map-options
    :options="options"
    :placeholder="placeholder"
    :disable="disable"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #selected>
      <span v-if="modelValue" class="ad-status-select__badge-wrap">
        <AdStatusBadge :status="String(modelValue)" />
      </span>
      <span v-else class="ad-status-select__placeholder">{{ placeholder }}</span>
    </template>
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section v-if="scope.opt.value" class="ad-status-select__option-badge">
          <AdStatusBadge :status="String(scope.opt.value)" />
        </q-item-section>
        <q-item-section v-else>
          <q-item-label>{{ scope.opt.label }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import AdStatusBadge from 'src/components/ui/AdStatusBadge.vue';

defineProps<{
  modelValue: string;
  options: { label: string; value: string }[];
  placeholder?: string;
  disable?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<style scoped lang="scss">
.ad-status-select {
  :deep(.q-field__native) {
    flex-wrap: nowrap;
  }

  :deep(.q-field__native > span) {
    display: inline-flex;
    width: auto;
    max-width: 100%;
    flex: 0 0 auto;
  }
}

.ad-status-select__badge-wrap {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
}

.ad-status-select__option-badge {
  flex: 0 0 auto;
  min-width: 0;

  :deep(.ad-badge) {
    width: fit-content;
  }
}

.ad-status-select__placeholder {
  color: #94a3b8;
  font-size: 0.875rem;
}
</style>
