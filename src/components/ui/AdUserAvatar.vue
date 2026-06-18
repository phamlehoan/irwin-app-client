<template>
  <q-avatar v-if="showImage" :size="size" :class="avatarClass">
    <img :src="resolvedSrc" alt="" referrerpolicy="no-referrer" @error="onImageError" />
  </q-avatar>
  <q-avatar
    v-else
    :size="size"
    text-color="white"
    :style="{ backgroundColor: avatarBg }"
    :class="['text-weight-bold', avatarClass]"
  >
    {{ initials }}
  </q-avatar>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  avatarColorFromSeed,
  avatarSeedFromUser,
  resolveAvatarUrl,
  userInitialsFromName,
} from 'src/utils/avatarUrl';

const props = withDefaults(
  defineProps<{
    avatarUrl?: string | null;
    name?: string;
    /** id hoặc email — dùng hash màu nền khi không có ảnh. */
    seed?: string;
    size?: string;
    avatarClass?: string;
  }>(),
  {
    avatarUrl: null,
    name: '',
    seed: '',
    size: '34px',
    avatarClass: '',
  },
);

const imageFailed = ref(false);

const resolvedSrc = computed(() => resolveAvatarUrl(props.avatarUrl));
const initials = computed(() => userInitialsFromName(props.name || '?'));
const showImage = computed(() => Boolean(resolvedSrc.value) && !imageFailed.value);
const avatarBg = computed(() =>
  avatarColorFromSeed(props.seed.trim() || avatarSeedFromUser({ name: props.name })),
);

watch(
  () => props.avatarUrl,
  () => {
    imageFailed.value = false;
  },
);

function onImageError() {
  imageFailed.value = true;
}
</script>
