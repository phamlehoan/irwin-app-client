import { ref } from 'vue';
import { http } from 'src/api/http';
import { unwrapData, type ApiBody } from 'src/api/unwrap';

export type InAppNotificationSender = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
};

export type InAppNotificationItem = {
  id: string;
  topicCode: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  sender: InAppNotificationSender | null;
};

export type InAppNotificationCursor = { createdAt: string; id: string };

export type InAppNotificationsPayload = {
  items: InAppNotificationItem[];
  unreadCount?: number;
  nextCursor: InAppNotificationCursor | null;
};

const DEFAULT_PAGE_SIZE = 20;

const loading = ref(false);
const loadingMore = ref(false);
const error = ref('');
const items = ref<InAppNotificationItem[]>([]);
const nextCursor = ref<InAppNotificationCursor | null>(null);
const hasMore = ref(true);
const unreadCount = ref(0);

export function resetInAppNotificationsState() {
  loading.value = false;
  loadingMore.value = false;
  error.value = '';
  items.value = [];
  nextCursor.value = null;
  hasMore.value = true;
  unreadCount.value = 0;
}

export function useInAppNotifications(pageSize = DEFAULT_PAGE_SIZE) {
  function resetListState() {
    items.value = [];
    nextCursor.value = null;
    hasMore.value = true;
  }

  async function fetchPage(append: boolean, maxItems?: number) {
    const params: Record<string, string | number> = {
      limit: maxItems ?? pageSize,
    };
    if (append && nextCursor.value) {
      params.cursorCreatedAt = nextCursor.value.createdAt;
      params.cursorId = nextCursor.value.id;
    }

    const { data: body } = await http.get<ApiBody<InAppNotificationsPayload>>('/notifications/in-app', {
      params,
    });
    const layer = unwrapData(body);
    const batch = (layer.items ?? []).map((row) => ({
      ...row,
      sender: row.sender ?? null,
    }));
    const nc = layer.nextCursor ?? null;

    if (typeof layer.unreadCount === 'number') {
      unreadCount.value = layer.unreadCount;
    }

    if (!append) {
      items.value = batch;
    } else {
      const seen = new Set(items.value.map((x) => x.id));
      for (const row of batch) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          items.value.push(row);
        }
      }
    }

    nextCursor.value = nc;
    hasMore.value = nc != null;
    return layer;
  }

  async function loadFirstPage(maxItems?: number) {
    error.value = '';
    loading.value = true;
    const shouldReset = items.value.length === 0;
    if (shouldReset) resetListState();
    try {
      await fetchPage(false, maxItems);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      if (shouldReset) items.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value || loading.value) return;
    if (!nextCursor.value) return;
    error.value = '';
    loadingMore.value = true;
    try {
      await fetchPage(true);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loadingMore.value = false;
    }
  }

  async function markAllRead() {
    await http.patch('/notifications/in-app/read-all', {});
    for (const it of items.value) {
      if (!it.readAt) it.readAt = new Date().toISOString();
    }
    unreadCount.value = 0;
  }

  return {
    loading,
    loadingMore,
    error,
    items,
    nextCursor,
    hasMore,
    unreadCount,
    loadFirstPage,
    loadMore,
    markAllRead,
  };
}
