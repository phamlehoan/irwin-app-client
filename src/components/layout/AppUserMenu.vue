<template>
  <div class="ad-popover-card ad-user-menu">
    <div class="ad-user-menu__head">
      <AdUserAvatar
        :avatar-url="avatarUrl ?? null"
        :name="displayName"
        :seed="userId || email"
        size="48px"
      />
      <div class="col min-w-0">
        <div class="ad-user-menu__name">{{ displayName }}</div>
        <div class="ad-user-menu__email">{{ email }}</div>
      </div>
    </div>
    <q-separator />
    <q-list padding class="q-py-sm">
      <q-item v-close-popup clickable to="/account" class="ad-user-menu__item">
        <q-item-section avatar><q-icon name="settings" size="20px" /></q-item-section>
        <q-item-section>{{ t('app.nav_settings') }}</q-item-section>
      </q-item>
      <q-item v-close-popup clickable :to="{ path: '/account', query: { section: 'password' } }" class="ad-user-menu__item">
        <q-item-section avatar><q-icon name="lock" size="20px" /></q-item-section>
        <q-item-section>{{ t('app.nav_change_password') }}</q-item-section>
      </q-item>
      <q-separator v-if="showLocaleSwitch" spaced />
      <template v-if="showLocaleSwitch">
        <q-item-label header class="text-caption text-grey-7">{{ t('app.language_switch') }}</q-item-label>
        <q-item
          v-for="opt in localeOptions"
          :key="opt.value"
          v-close-popup
          clickable
          :active="locale === opt.value"
          active-class="text-primary"
          class="ad-user-menu__item"
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
      </template>
      <q-separator spaced />
      <q-item v-close-popup clickable class="ad-user-menu__item ad-user-menu__item--danger" @click="$emit('logout')">
        <q-item-section avatar><q-icon name="logout" size="20px" /></q-item-section>
        <q-item-section>{{ t('app.sign_out') }}</q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AdUserAvatar from 'src/components/ui/AdUserAvatar.vue';
import FlagIcon from 'src/components/ui/FlagIcon.vue';
import type { MessageLanguages } from 'src/boot/i18n';

const LOCALE_KEY = 'ad-locale';

withDefaults(
  defineProps<{
    displayName: string;
    email: string;
    avatarUrl?: string | null;
    userId?: string;
    /** Hiện khi nút đổi ngôn ngữ trên topbar bị ẩn (mobile). */
    showLocaleSwitch?: boolean;
  }>(),
  { showLocaleSwitch: false },
);

defineEmits<{ logout: [] }>();

const { t, locale } = useI18n();

const localeOptions: { value: MessageLanguages; label: string }[] = [
  { value: 'vi-VN', label: 'Tiếng Việt' },
  { value: 'en-US', label: 'English' },
];

function setLocale(next: MessageLanguages) {
  locale.value = next;
  localStorage.setItem(LOCALE_KEY, next);
}
</script>

<style scoped>
.min-w-0 {
  min-width: 0;
}
</style>
