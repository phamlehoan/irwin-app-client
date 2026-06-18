<template>
  <div class="ad-popover-card notif-popover column no-wrap" :class="{ 'notif-popover--sheet': showClose }">
    <div class="notif-popover__head row items-center no-wrap q-px-md q-pt-md q-pb-sm">
      <div class="text-subtitle1 text-weight-bold">{{ t('app.notif_popover_title') }}</div>
      <q-space />
      <q-btn
        v-if="unreadCount > 0"
        flat
        dense
        no-caps
        size="sm"
        color="primary"
        class="ad-btn-outline"
        :class="{ 'q-mr-xs': showClose }"
        :label="t('app.notif_mark_all_read')"
        :disable="loading"
        @click="onMarkAllRead"
      />
      <q-btn
        v-if="showClose"
        flat
        dense
        icon="close"
        class="ad-icon-btn ad-icon-btn--sm notif-popover__close"
        :aria-label="t('app.btn_close')"
        @click="emit('close')"
      />
    </div>

    <div class="row items-center q-px-md q-pb-sm notif-popover__filters">
      <div class="notif-filter-tabs" role="tablist" :aria-label="t('app.notif_popover_title')">
        <button
          type="button"
          role="tab"
          class="notif-filter-tabs__btn"
          :class="{ 'notif-filter-tabs__btn--active': filter === 'all' }"
          :aria-selected="filter === 'all'"
          @click="filter = 'all'"
        >
          {{ t('app.notif_filter_all') }}
        </button>
        <button
          type="button"
          role="tab"
          class="notif-filter-tabs__btn"
          :class="{ 'notif-filter-tabs__btn--active': filter === 'unread' }"
          :aria-selected="filter === 'unread'"
          @click="filter = 'unread'"
        >
          {{ unreadTabLabel }}
        </button>
      </div>
      <q-space />
      <router-link to="/notifications/inbox" class="ad-link text-caption" @click="$emit('view-all')">
        {{ t('app.notif_view_all') }}
      </router-link>
    </div>

    <q-separator />

    <q-banner v-if="error" dense rounded class="bg-negative text-white q-mx-md q-mt-sm shrink">
      {{ error }}
    </q-banner>

    <div class="notif-popover__list">
      <div v-if="loading" class="flex flex-center q-py-lg">
        <q-spinner color="primary" size="1.5em" />
      </div>
      <div v-else-if="filteredItems.length === 0" class="text-grey-7 text-body2 q-pa-md text-center">
        {{ t('app.notif_inbox_empty') }}
      </div>
      <div
        v-for="it in filteredItems"
        :key="it.id"
        class="notif-popover__item row no-wrap items-start q-px-md q-py-sm"
        :class="{ 'notif-popover__item--unread': !it.readAt }"
      >
        <AdNotificationAvatar :sender="it.sender" size="36px" class="q-mr-sm shrink" />
        <div class="col min-w-0">
          <div class="inapp-notif-title text-body2 text-weight-bold">{{ it.title }}</div>
          <div class="text-caption text-grey-6 q-mt-xs">{{ formatRelativeTime(it.createdAt, locale) }}</div>
          <div class="inapp-notif-body text-body2 text-grey-8 q-mt-xs">{{ it.body }}</div>
        </div>
        <div v-if="!it.readAt" class="col-auto q-pt-xs">
          <span class="notif-popover__dot" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useInAppNotifications } from 'src/composables/useInAppNotifications';
import { formatRelativeTime } from 'src/utils/relativeTime';
import { requestInAppUnreadBadgeRefresh } from 'src/utils/inAppUnreadBadge';
import AdNotificationAvatar from 'src/components/ui/AdNotificationAvatar.vue';

const emit = defineEmits<{ 'view-all': []; loaded: [unread: number]; close: [] }>();

withDefaults(
  defineProps<{
    showClose?: boolean;
  }>(),
  { showClose: false },
);

const { t, locale } = useI18n();
const { loading, error, items, unreadCount, loadFirstPage, markAllRead } = useInAppNotifications();

const filter = ref<'all' | 'unread'>('all');

const filteredItems = computed(() => {
  if (filter.value === 'unread') return items.value.filter((x) => !x.readAt);
  return items.value;
});

const unreadTabLabel = computed(() => {
  const n = unreadCount.value;
  return n > 0 ? `${t('app.notif_filter_unread')} (${n})` : t('app.notif_filter_unread');
});

const POPOVER_PAGE_SIZE = 15;

async function load() {
  await loadFirstPage(POPOVER_PAGE_SIZE);
  emit('loaded', unreadCount.value);
}

async function onMarkAllRead() {
  try {
    await markAllRead();
    emit('loaded', 0);
    requestInAppUnreadBadgeRefresh();
  } catch {
    /* ignore */
  }
}

defineExpose({ load, markAllRead: onMarkAllRead });
</script>

<style scoped lang="scss">
.notif-popover {
  width: min(96vw, 420px);
  max-height: min(85vh, 520px);
  height: auto;
}

.notif-popover--sheet {
  width: 100%;
  max-width: 100%;
  border-radius: 16px 16px 0 0;
}

.notif-popover__close {
  color: #64748b;
  flex-shrink: 0;
}

.notif-popover__filters {
  gap: 12px;
}

.notif-filter-tabs {
  display: inline-flex;
  align-items: stretch;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
  background: #fff;
  flex-shrink: 0;
}

.notif-filter-tabs__btn {
  border: none;
  margin: 0;
  padding: 7px 16px;
  background: #fff;
  color: #64748b;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.2;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease;

  & + & {
    border-left: 1px solid #e2e8f0;
  }

  &--active {
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 600;
  }

  &:hover:not(&--active) {
    background: #f8fafc;
  }
}

.notif-popover__list {
  overflow-y: auto;
  max-height: min(50vh, 360px);
}

.notif-popover__item {
  border-bottom: 1px solid #f1f5f9;

  &--unread {
    background: rgba(21, 101, 192, 0.06);
  }
}

.inapp-notif-body {
  line-height: 1.45;
  white-space: pre-wrap;
}

.notif-popover__dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ad-blue);
}

.min-w-0 {
  min-width: 0;
}

.shrink {
  flex-shrink: 0;
}
</style>
