<template>
  <div class="inapp-notif-root">
    <div class="row items-center q-mb-md inapp-notif-toolbar">
      <div :class="dense ? 'text-subtitle1 text-weight-medium' : 'text-h6'">
        {{ t('app.notif_inbox_title') }}
      </div>
      <q-space />
      <q-btn
        v-if="unreadCount > 0"
        flat
        dense
        no-caps
        color="primary"
        :label="t('app.notif_mark_all_read')"
        :disable="loading"
        class="ad-btn-outline q-mr-xs"
        @click="onMarkAllRead"
      />
      <q-btn
        flat
        dense
        icon="refresh"
        color="primary"
        :disable="loading"
        class="ad-icon-btn"
        @click="onRefresh"
      >
        <q-tooltip>{{ t('app.refresh') }}</q-tooltip>
      </q-btn>
    </div>

    <q-banner v-if="error" class="bg-negative text-white q-mb-md" dense rounded>{{ error }}</q-banner>

    <div v-if="loading && items.length === 0" class="flex flex-center q-py-lg">
      <q-spinner color="primary" size="2em" />
    </div>

    <div v-else class="inapp-notif-list">
      <div v-if="loading && items.length > 0" class="row justify-center q-py-sm">
        <q-spinner color="primary" size="1.5em" />
      </div>

      <div v-if="items.length" class="column q-gutter-md">
        <q-card
          v-for="it in items"
          :key="it.id"
          flat
          bordered
          class="inapp-notif-card"
          :class="{ 'inapp-notif-card--unread': !it.readAt }"
        >
          <q-card-section class="q-pa-md">
            <div class="row no-wrap items-start q-gutter-sm">
              <AdNotificationAvatar :sender="it.sender" size="40px" class="shrink" />
              <div class="col min-w-0">
                <div class="inapp-notif-title text-body1 text-weight-bold">{{ it.title }}</div>
                <div class="inapp-notif-time text-caption text-grey-7 text-italic q-mt-xs">
                  {{ formatDateTime(it.createdAt, locale) }}
                </div>
                <div class="inapp-notif-body text-body2 text-grey-9 q-mt-sm">{{ it.body }}</div>
              </div>
              <div v-if="!it.readAt" class="col-auto flex flex-center q-pt-xs">
                <span class="inapp-notif-dot" aria-hidden="true" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div v-else class="text-grey-7 text-body2">{{ t('app.notif_inbox_empty') }}</div>

      <div v-if="loadingMore" class="row justify-center q-py-md">
        <q-spinner color="primary" size="1.5em" />
      </div>
      <div
        v-if="!hasMore && items.length > 0 && !loading && !loadingMore"
        class="text-caption text-grey-6 text-center q-pb-md q-pt-sm"
      >
        {{ t('app.notif_inbox_end') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useInAppNotifications } from 'src/composables/useInAppNotifications';
import { formatDateTime } from 'src/utils/dateDisplay';
import { requestInAppUnreadBadgeRefresh } from 'src/utils/inAppUnreadBadge';
import AdNotificationAvatar from 'src/components/ui/AdNotificationAvatar.vue';

withDefaults(
  defineProps<{
    dense?: boolean;
  }>(),
  { dense: false },
);

const { t, locale } = useI18n();
const { loading, loadingMore, error, items, hasMore, unreadCount, loadFirstPage, loadMore, markAllRead } =
  useInAppNotifications();

async function onRefresh() {
  await loadFirstPage();
  requestInAppUnreadBadgeRefresh();
}

async function onMarkAllRead() {
  try {
    await markAllRead();
    requestInAppUnreadBadgeRefresh();
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

function onWindowScroll() {
  if (loading.value || loadingMore.value || !hasMore.value) return;
  const gap = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
  if (gap > 220) return;
  void loadMore();
}

onMounted(() => {
  void onRefresh();
  window.addEventListener('scroll', onWindowScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', onWindowScroll);
});

defineExpose({ load: onRefresh, markAllReadAndReload: onMarkAllRead });
</script>

<style scoped>
.inapp-notif-root {
  padding-bottom: 4px;
}

.inapp-notif-toolbar {
  gap: 8px;
}

.inapp-notif-list {
  padding-bottom: 8px;
}
.inapp-notif-card {
  border-radius: 12px;
  transition: box-shadow 0.2s ease;
}
.inapp-notif-card--unread {
  border-color: rgba(25, 118, 210, 0.35);
  background: rgba(25, 118, 210, 0.04);
}
.inapp-notif-title {
  line-height: 1.35;
  letter-spacing: 0.01em;
}
.inapp-notif-time {
  letter-spacing: 0.02em;
}
.inapp-notif-body {
  line-height: 1.5;
  white-space: pre-wrap;
}
.inapp-notif-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  color: var(--q-primary);
  flex-shrink: 0;
}
.shrink {
  flex-shrink: 0;
}
.min-w-0 {
  min-width: 0;
}
</style>
