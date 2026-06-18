<template>
  <div class="ad-form-field" :class="{ 'ad-form-field--full': full }">
    <label v-if="label" class="ad-form-field__label">
      {{ label }}<span v-if="required" class="ad-form-field__req" aria-hidden="true"> *</span>
    </label>
    <slot />
    <div v-if="error" class="ad-form-field__error">{{ error }}</div>
    <div v-else-if="hint" class="ad-form-field__hint">{{ hint }}</div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    full?: boolean;
  }>(),
  { required: false, full: false },
);
</script>
