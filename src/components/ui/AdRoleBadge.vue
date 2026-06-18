<template>
  <span class="ad-role-badge">{{ label }}</span>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>

<style scoped lang="scss">
@import 'src/css/brand.scss';

.ad-role-badge {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba($ad-blue, 0.08);
  border: 1px solid rgba($ad-blue, 0.18);
  color: $ad-blue-dark;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
