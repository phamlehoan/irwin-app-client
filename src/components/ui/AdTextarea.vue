<template>
  <q-input
    class="ad-textarea"
    :class="{ 'ad-textarea--compact': compact }"
    :model-value="modelValue"
    type="textarea"
    outlined
    dense
    hide-bottom-space
    autogrow
    :rows="rows"
    :label="label"
    :placeholder="placeholder"
    :disable="disable"
    :maxlength="maxlength"
    :error="!!error"
    :error-message="error"
    :input-style="mergedInputStyle"
    @update:model-value="emit('update:modelValue', String($event ?? ''))"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    placeholder?: string;
    disable?: boolean;
    rows?: number;
    maxlength?: number;
    error?: string;
    inputStyle?: string | Record<string, string>;
    /** Chiều cao tối thiểu ~2 dòng input (vd. tiêu đề email). */
    compact?: boolean;
  }>(),
  {
    label: '',
    placeholder: '',
    disable: false,
    rows: 3,
    compact: false,
  },
);

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const mergedInputStyle = computed(() => {
  const baseMin = props.compact ? '80px' : '120px';
  if (!props.inputStyle) return { minHeight: baseMin };
  if (typeof props.inputStyle === 'string') return props.inputStyle;
  return { minHeight: baseMin, ...props.inputStyle };
});
</script>

<style scoped lang="scss">
.ad-textarea {
  :deep(textarea) {
    min-height: 120px;
    line-height: 1.5;
    resize: vertical;
  }

  &--compact :deep(textarea) {
    min-height: 80px;
  }
}
</style>
