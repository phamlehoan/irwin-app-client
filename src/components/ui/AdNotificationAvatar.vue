<template>
  <AdUserAvatar
    v-if="sender"
    :avatar-url="sender.avatarUrl"
    :name="sender.fullName"
    :seed="sender.id"
    :size="size"
    :avatar-class="avatarClass"
  />
  <q-avatar
    v-else
    :size="size"
    class="ad-notif-system-avatar"
    :class="avatarClass"
  >
    <q-icon name="settings" :size="iconSize" />
  </q-avatar>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AdUserAvatar from 'src/components/ui/AdUserAvatar.vue';
import type { InAppNotificationSender } from 'src/composables/useInAppNotifications';

const props = withDefaults(
  defineProps<{
    sender?: InAppNotificationSender | null;
    size?: string;
    avatarClass?: string;
  }>(),
  {
    sender: null,
    size: '36px',
    avatarClass: '',
  },
);

const iconSize = computed(() => {
  const n = Number.parseInt(String(props.size), 10);
  if (Number.isFinite(n) && n > 0) return `${Math.round(n * 0.5)}px`;
  return '18px';
});
</script>

<style scoped lang="scss">
.ad-notif-system-avatar {
  background: #e2e8f0;
  color: #475569;
}
</style>
