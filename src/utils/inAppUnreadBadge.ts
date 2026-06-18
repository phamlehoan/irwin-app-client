/** MainLayout lắng nghe và gọi GET /notifications/in-app/unread-count. */
export const INAPP_UNREAD_BADGE_REFRESH_EVENT = 'smartwh:inapp-unread-refresh';

/** Báo cần đồng bộ số badge (sau push foreground, sau đánh dấu đã đọc, v.v.). */
export function requestInAppUnreadBadgeRefresh(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(INAPP_UNREAD_BADGE_REFRESH_EVENT));
}
