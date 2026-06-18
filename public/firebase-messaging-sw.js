/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const qp = new URL(self.location.href).searchParams;
const config = {
  apiKey: qp.get('apiKey') || '',
  authDomain: qp.get('authDomain') || undefined,
  projectId: qp.get('projectId') || '',
  messagingSenderId: qp.get('messagingSenderId') || '',
  appId: qp.get('appId') || '',
};

const canInit =
  config.apiKey &&
  config.projectId &&
  config.messagingSenderId &&
  config.appId;

if (canInit) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const title =
      payload.notification?.title ||
      payload.data?.title ||
      'Thông báo mới';
    const body =
      payload.notification?.body ||
      payload.data?.body ||
      '';
    const route = payload.data?.route || '/notifications/inbox';
    self.registration.showNotification(title, {
      body,
      data: { route },
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  const route = event.notification?.data?.route || '/notifications/inbox';
  event.notification.close();
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({
      includeUncontrolled: true,
      type: 'window',
    });
    for (const client of allClients) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) await client.navigate(route);
        return;
      }
    }
    await self.clients.openWindow(route);
  })());
});
