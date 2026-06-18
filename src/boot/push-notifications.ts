import { defineBoot } from '#q-app/wrappers';
import { watch } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import {
  disablePushNotifications,
  enablePushNotifications,
  setPushNotificationRouter,
} from 'src/utils/pushNotifications';

export default defineBoot(({ router }) => {
  setPushNotificationRouter(router);
  const auth = useAuthStore();
  watch(
    () => auth.isAuthenticated,
    async (isAuthed) => {
      if (isAuthed) {
        await enablePushNotifications(router);
      } else {
        await disablePushNotifications();
      }
    },
    { immediate: true, flush: 'sync' },
  );
});
