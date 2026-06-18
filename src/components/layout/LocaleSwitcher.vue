<template>
  <q-btn
    flat
    dense
    class="ad-icon-btn ad-locale-btn q-ml-sm"
    :aria-label="t('app.language_switch')"
  >
    <FlagIcon :locale="locale" />
    <q-tooltip>{{ t('app.language_switch') }}</q-tooltip>
    <q-menu anchor="bottom right" self="top right" :offset="[0, 8]">
      <q-list dense style="min-width: 180px">
        <q-item
          v-for="opt in options"
          :key="opt.value"
          v-close-popup
          clickable
          :active="locale === opt.value"
          active-class="text-primary"
          @click="setLocale(opt.value)"
        >
          <q-item-section avatar>
            <FlagIcon :locale="opt.value" />
          </q-item-section>
          <q-item-section>{{ opt.label }}</q-item-section>
          <q-item-section v-if="locale === opt.value" side>
            <q-icon name="check" color="primary" size="18px" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import FlagIcon from 'src/components/ui/FlagIcon.vue';
import type { MessageLanguages } from 'src/boot/i18n';

const LOCALE_KEY = 'ad-locale';

const { t, locale } = useI18n();

const options: { value: MessageLanguages; label: string }[] = [
  { value: 'vi-VN', label: 'Tiếng Việt' },
  { value: 'en-US', label: 'English' },
];

function setLocale(next: MessageLanguages) {
  locale.value = next;
  localStorage.setItem(LOCALE_KEY, next);
}
</script>

<style scoped lang="scss">
.ad-locale-btn {
  :deep(.flag-icon svg) {
    width: 18px;
  }
}
</style>
