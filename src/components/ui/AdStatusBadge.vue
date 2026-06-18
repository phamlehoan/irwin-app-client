<template>
  <span class="ad-badge" :class="`ad-badge--${tone}`">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: string;
}>();

const tone = computed(() => {
  const s = props.status.toUpperCase();
  if (s === 'ACTIVE') return 'positive';
  if (s === 'PENDING' || s === 'REQUESTING' || s === 'LAPSING') return 'warning';
  if (s === 'INACTIVE' || s === 'SUSPENDED' || s === 'LAPSED') return 'negative';
  return 'neutral';
});

const label = computed(() => props.status);
</script>
