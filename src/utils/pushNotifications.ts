import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  type PushNotificationSchema,
  type ActionPerformed,
} from '@capacitor/push-notifications';
import {
  getApps,
  initializeApp,
  type FirebaseOptions,
} from 'firebase/app';
import {
  getMessaging,
  getToken,
  isSupported as isWebMessagingSupported,
  onMessage,
  type MessagePayload,
  type Messaging,
  type Unsubscribe,
} from 'firebase/messaging';
import { Notify } from 'quasar';
import type { Router } from 'vue-router';
import { http } from 'src/api/http';
import { requestInAppUnreadBadgeRefresh } from 'src/utils/inAppUnreadBadge';

const INBOX_ROUTE = '/notifications/inbox';

let booted = false;
let listenerBound = false;
let currentToken: string | null = null;
let webToken: string | null = null;
let appRouter: Router | null = null;
let bootRouter: Router | null = null;

export function setPushNotificationRouter(router: Router) {
  bootRouter = router;
}

export async function enablePushNotificationsFromBootRouter() {
  if (!bootRouter) return;
  await enablePushNotifications(bootRouter);
}

let webUnsubscribe: Unsubscribe | null = null;
let webMessaging: Messaging | null = null;
let webSwRegistration: ServiceWorkerRegistration | null = null;

function nativePlatform(): string {
  const p = Capacitor.getPlatform();
  if (p === 'ios') return 'IOS';
  if (p === 'android') return 'ANDROID';
  return 'WEB';
}

type PushPlatform = 'ANDROID' | 'IOS' | 'WEB';

async function registerTokenToCloud(token: string, platform: PushPlatform) {
  await http.post('/notifications/push-tokens/register', {
    token,
    platform,
    appVersion: import.meta.env.MODE || '',
  });
}

async function unregisterTokenFromCloud(token?: string) {
  await http.post('/notifications/push-tokens/unregister', {
    ...(token ? { token } : {}),
  });
}

function toNotificationBody(n: PushNotificationSchema): string {
  return (n.body || n.title || '').trim();
}

function onPushReceived(notification: PushNotificationSchema) {
  const message = toNotificationBody(notification);
  requestInAppUnreadBadgeRefresh();
  if (!message) return;
  Notify.create({
    type: 'info',
    message,
    timeout: 3500,
  });
}

function onPushAction(action: ActionPerformed) {
  const route = String(action.notification.data?.route || '').trim();
  const go = route || INBOX_ROUTE;
  if (appRouter) {
    void appRouter.push(go);
  }
}

function firebaseWebConfig(): FirebaseOptions | null {
  const apiKey = String(import.meta.env.VITE_FIREBASE_API_KEY || '').trim();
  const projectId = String(import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim();
  const appId = String(import.meta.env.VITE_FIREBASE_APP_ID || '').trim();
  const authDomain = String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim();
  const messagingSenderId = String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim();
  if (!apiKey || !projectId || !appId || !messagingSenderId) return null;
  return {
    apiKey,
    projectId,
    appId,
    messagingSenderId,
    ...(authDomain ? { authDomain } : {}),
  };
}

function buildWebSwUrl(cfg: FirebaseOptions): string {
  const params = new URLSearchParams({
    apiKey: cfg.apiKey || '',
    authDomain: cfg.authDomain || '',
    projectId: cfg.projectId || '',
    messagingSenderId: cfg.messagingSenderId || '',
    appId: cfg.appId || '',
  });
  return `/firebase-messaging-sw.js?${params.toString()}`;
}

function onWebMessage(payload: MessagePayload) {
  const title = String(payload.notification?.title || payload.data?.title || '').trim();
  const body = String(payload.notification?.body || payload.data?.body || '').trim();
  const route = String(payload.data?.route || '').trim();
  requestInAppUnreadBadgeRefresh();
  if (body || title) {
    Notify.create({
      type: 'info',
      message: body || title,
      timeout: 4500,
      ...(route
        ? {
            actions: [
              {
                label: 'Mở',
                color: 'white',
                handler: () => {
                  if (appRouter) void appRouter.push(route);
                },
              },
            ],
          }
        : {}),
    });
  }
}

async function bindListeners() {
  if (listenerBound) return;
  await PushNotifications.addListener('registration', (token) => {
    currentToken = token.value;
    void (async () => {
      try {
        await registerTokenToCloud(token.value, nativePlatform() as PushPlatform);
      } catch (e) {
        console.warn('[push] register token failed', e);
      }
    })();
  });
  await PushNotifications.addListener('registrationError', (error) => {
    console.warn('[push] registration error', error);
  });
  await PushNotifications.addListener('pushNotificationReceived', onPushReceived);
  await PushNotifications.addListener('pushNotificationActionPerformed', onPushAction);
  listenerBound = true;
}

export async function enablePushNotifications(router: Router) {
  appRouter = router;
  if (!Capacitor.isNativePlatform()) {
    const cfg = firebaseWebConfig();
    if (!cfg || booted) return;
    if (!(await isWebMessagingSupported())) return;
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
    const app = getApps()[0] ?? initializeApp(cfg);
    webMessaging = getMessaging(app);
    webSwRegistration = await navigator.serviceWorker.register(buildWebSwUrl(cfg));
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') return;
    const vapidKey = String(import.meta.env.VITE_FIREBASE_VAPID_KEY || '').trim();
    const token = await getToken(webMessaging, {
      serviceWorkerRegistration: webSwRegistration,
      ...(vapidKey ? { vapidKey } : {}),
    });
    if (!token) {
      console.warn('[push] web getToken returned empty; will retry on next enable');
      return;
    }
    webToken = token;
    await registerTokenToCloud(token, 'WEB');
    if (!webUnsubscribe) {
      webUnsubscribe = onMessage(webMessaging, onWebMessage);
    }
    booted = true;
    return;
  }
  if (booted) return;
  const perm = await PushNotifications.checkPermissions();
  let receive = perm.receive;
  if (receive === 'prompt') {
    const requested = await PushNotifications.requestPermissions();
    receive = requested.receive;
  }
  if (receive !== 'granted') return;
  await bindListeners();
  await PushNotifications.register();
  booted = true;
}

export async function disablePushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    try {
      if (webToken) await unregisterTokenFromCloud(webToken);
      else await unregisterTokenFromCloud();
    } catch {
      // no-op
    }
    if (webUnsubscribe) webUnsubscribe();
    webUnsubscribe = null;
    webToken = null;
    webMessaging = null;
    webSwRegistration = null;
    booted = false;
    return;
  }
  try {
    if (currentToken) await unregisterTokenFromCloud(currentToken);
    else await unregisterTokenFromCloud();
  } catch {
    // no-op
  }
  await PushNotifications.removeAllListeners();
  listenerBound = false;
  currentToken = null;
  booted = false;
}
