import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/activate-account',
    component: () => import('pages/ActivateAccountPage.vue'),
    meta: { public: true },
  },
  {
    path: '/forgot-password',
    component: () => import('pages/ForgotPasswordPage.vue'),
    meta: { public: true },
  },
  {
    path: '/reset-password',
    component: () => import('pages/ResetPasswordPage.vue'),
    meta: { public: true },
  },
  {
    path: '/google-request-account',
    component: () => import('pages/GoogleRequestAccountPage.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/DashboardPage.vue'),
        meta: { breadcrumbTitle: 'app.nav_dashboard' },
      },
      {
        path: 'admin',
        component: () => import('pages/DashboardPage.vue'),
        meta: {
          breadcrumbParent: 'app.nav_admin',
          breadcrumbTitle: 'app.nav_dashboard',
          adminWorkspace: true,
        },
      },
      {
        path: 'account',
        component: () => import('pages/AccountProfilePage.vue'),
        meta: { breadcrumbTitle: 'app.nav_settings' },
      },
      {
        path: 'notifications/inbox',
        component: () => import('pages/notifications/InAppNotificationsPage.vue'),
        meta: { breadcrumbTitle: 'app.nav_inbox' },
      },
      {
        path: 'notifications/settings',
        component: () => import('pages/notifications/NotificationSettingsPage.vue'),
        meta: { breadcrumbParent: 'app.nav_notif_settings', breadcrumbTitle: 'app.nav_notif_settings', permission: 'NOT::READ' },
      },
      {
        path: 'notifications/settings/:code',
        component: () => import('pages/notifications/NotificationTopicDetailPage.vue'),
        meta: { breadcrumbParent: 'app.nav_notif_settings', breadcrumbTitle: 'app.notif_topic_detail', permission: 'NOT::READ' },
      },
      {
        path: 'admin/users',
        component: () => import('pages/admin/AdminUsersPage.vue'),
        meta: { breadcrumbParent: 'app.nav_admin', breadcrumbTitle: 'app.admin_users_title', permission: 'USM::READ' },
      },
      {
        path: 'admin/roles',
        component: () => import('pages/admin/AdminRolesPage.vue'),
        meta: { breadcrumbParent: 'app.nav_admin', breadcrumbTitle: 'app.admin_roles_title', permission: 'RAP::READ' },
      },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
