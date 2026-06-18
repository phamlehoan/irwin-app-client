<template>
  <span class="flag-icon" :class="`flag-icon--${variant}`" role="img" :aria-label="ariaLabel">
    <svg v-if="variant === 'vi'" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
      <rect width="30" height="20" fill="#da251d" />
      <polygon
        fill="#ff0"
        points="15,3.2 16.76,8.68 22.43,8.68 17.83,11.98 19.59,17.36 15,14.06 10.41,17.36 12.17,11.98 7.57,8.68 13.24,8.68"
      />
    </svg>
    <svg v-else viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
      <rect width="30" height="20" fill="#b22234" />
      <rect y="1.54" width="30" height="1.54" fill="#fff" />
      <rect y="4.62" width="30" height="1.54" fill="#fff" />
      <rect y="7.69" width="30" height="1.54" fill="#fff" />
      <rect y="10.77" width="30" height="1.54" fill="#fff" />
      <rect y="13.85" width="30" height="1.54" fill="#fff" />
      <rect y="16.92" width="30" height="1.54" fill="#fff" />
      <rect width="12" height="10.77" fill="#3c3b6e" />
    </svg>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  locale: string;
}>();

const variant = computed(() => (props.locale === 'en-US' ? 'us' : 'vi'));

const ariaLabel = computed(() => (variant.value === 'vi' ? 'Vietnam' : 'United States'));
</script>

<style scoped lang="scss">
.flag-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  border-radius: 2px;
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);

  svg {
    display: block;
    width: 20px;
    height: auto;
  }

  &--us svg {
    width: 22px;
  }
}
</style>
