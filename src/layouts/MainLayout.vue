<template>
  <q-layout view="lHh Lpr lFf" class="ad-layout">
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="drawerWidth"
      :breakpoint="1024"
      class="ad-sidebar"
      :class="{ 'ad-sidebar--expanded': !sidebarMini, 'ad-sidebar--mini': sidebarMini }"
    >
      <div class="ad-sidebar-inner column no-wrap fit">
        <div class="ad-sidebar-brand flex flex-center">
          <q-avatar size="40px" color="primary" text-color="white" class="text-weight-bold ad-brand-logo">
            AD
          </q-avatar>
          <span v-if="!sidebarMini" class="ad-brand-text q-ml-sm text-weight-bold">{{ t('app.product_name_short') }}</span>
        </div>

        <q-scroll-area class="col ad-nav-scroll">
          <q-list padding class="ad-nav-list">
            <q-item
              v-for="item in sidebarNavItems"
              :key="item.to"
              v-ripple
              clickable
              :to="item.to"
              :exact="item.exact"
              active-class="ad-nav-item--active"
              class="ad-nav-item"
            >
              <q-tooltip
                v-if="sidebarMini"
                :delay="400"
                anchor="center right"
                self="center left"
                :offset="[10, 0]"
              >
                {{ item.label }}
              </q-tooltip>
              <div class="ad-nav-icon-wrap">
                <q-icon :name="item.icon" size="22px" />
              </div>
              <span v-if="!sidebarMini" class="ad-nav-label">{{ item.label }}</span>
            </q-item>
          </q-list>
        </q-scroll-area>

        <div class="ad-sidebar-footer flex flex-center">
          <q-btn
            flat
            dense
            round
            :icon="sidebarMini ? 'chevron_right' : 'chevron_left'"
            color="grey-5"
            :aria-label="sidebarMini ? t('app.sidebar_expand') : t('app.sidebar_collapse')"
            @click="toggleSidebarSize"
          />
        </div>
      </div>
    </q-drawer>

    <q-page-container
      class="ad-page-container"
      :class="{
        'ad-page-container--bottom-nav': showBottomNav && bottomNavVisible,
      }"
    >
      <header v-if="auth.isAuthenticated" class="ad-topbar row items-center no-wrap">
        <template v-if="isPhone">
          <q-btn
            flat
            round
            dense
            icon="arrow_back"
            class="q-mr-xs ad-icon-btn ad-topbar-back"
            :aria-label="t('app.back')"
            @click="goBack"
          />

          <q-btn
            flat
            round
            dense
            icon="route"
            class="ad-icon-btn ad-topbar-breadcrumb"
            :aria-label="t('app.nav_breadcrumb_menu')"
          >
            <q-menu anchor="bottom left" self="top left" :offset="[0, 8]">
              <q-list dense style="min-width: 220px">
                <q-item-label header class="text-weight-bold">{{ t('app.nav_breadcrumb_menu') }}</q-item-label>
                <q-item
                  v-for="(crumb, idx) in breadcrumbs"
                  :key="idx"
                  v-close-popup
                  clickable
                  :to="crumb.to"
                  :disable="!crumb.to || idx === breadcrumbs.length - 1"
                  :active="idx === breadcrumbs.length - 1"
                  active-class="text-primary"
                >
                  <q-item-section>
                    <span :style="idx > 0 ? { paddingLeft: `${idx * 12}px` } : undefined">{{ crumb.label }}</span>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </template>

        <template v-else>
          <q-btn
            v-if="!$q.screen.gt.md"
            flat
            round
            dense
            icon="menu"
            aria-label="Menu"
            class="q-mr-sm ad-icon-btn"
            @click="leftDrawerOpen = !leftDrawerOpen"
          />

          <nav class="ad-breadcrumb row items-center no-wrap" aria-label="Breadcrumb">
            <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
              <span v-if="idx > 0" class="ad-breadcrumb__sep">/</span>
              <router-link
                v-if="crumb.to && idx < breadcrumbs.length - 1"
                :to="crumb.to"
                class="ad-breadcrumb__link"
              >
                {{ crumb.label }}
              </router-link>
              <span v-else class="ad-breadcrumb__current">{{ crumb.label }}</span>
            </template>
          </nav>
        </template>

        <q-space />

        <q-btn
          class="ai-toolbar-ai-btn q-ml-sm"
          unelevated
          rounded
          dense
          no-caps
          color="primary"
          text-color="white"
          icon="auto_awesome"
          :label="isPhone ? undefined : ($q.screen.gt.xs ? t('app.ai_toolbar_btn') : undefined)"
          :aria-label="t('app.ai_title')"
          @click="aiOpen = true"
        >
          <q-tooltip v-if="isPhone">{{ t('app.ai_title') }}</q-tooltip>
        </q-btn>

        <LocaleSwitcher v-if="!isPhone" />

        <q-btn
          v-if="!isPhone"
          flat
          dense
          class="ad-icon-btn relative-position q-ml-sm"
          :aria-label="t('app.nav_inbox')"
        >
          <q-icon name="notifications_none" size="20px" />
          <q-badge
            v-if="notifUnreadCount > 0"
            color="accent"
            floating
            rounded
            class="notif-badge-dot"
          />
          <q-menu
            v-model="notifMenuOpen"
            anchor="bottom right"
            self="top right"
            :offset="[0, 8]"
            @before-show="onNotifMenuShow"
          >
            <NotificationPopover
              ref="notifMenuPopoverRef"
              @view-all="notifMenuOpen = false"
              @loaded="onNotifLoaded"
            />
          </q-menu>
        </q-btn>

        <q-btn
          class="ad-icon-btn ad-icon-btn--sm q-ml-sm"
          flat
          dense
          :class="{ 'ad-icon-btn--active': workspaceOpen }"
          :aria-label="t('app.nav_quick_menu')"
          :aria-expanded="workspaceOpen"
          @click="workspaceOpen = true"
        >
          <q-icon name="apps" size="18px" />
        </q-btn>

        <WorkspaceSwitcher
          v-model="workspaceOpen"
          :workspaces="availableWorkspaces"
          :current-id="workspace.currentId"
          @select="onWorkspaceSelect"
        />

        <q-btn v-if="auth.user" flat dense padding="xs" class="q-ml-sm ad-user-trigger">
          <AdUserAvatar
            :avatar-url="auth.user.avatarUrl"
            :name="displayName"
            :seed="auth.user.id"
            size="34px"
          />
          <q-menu anchor="bottom right" self="top right" :offset="[0, 8]">
            <AppUserMenu
              :display-name="displayName"
              :email="auth.user.email"
              :avatar-url="auth.user.avatarUrl"
              :user-id="auth.user.id"
              :show-locale-switch="isPhone"
              @logout="logout"
            />
          </q-menu>
        </q-btn>

        <AiAssistantPanel v-model="aiOpen" />
      </header>

      <router-view />
    </q-page-container>

    <q-footer
      v-if="auth.isAuthenticated && showBottomNav"
      class="ad-bottom-nav"
      :class="{ 'ad-bottom-nav--hidden': !bottomNavVisible }"
      bordered
    >
      <div class="ad-bottom-nav__inner row no-wrap items-stretch full-width">
        <nav class="ad-bottom-nav__items row no-wrap col" :aria-label="t('app.menu')">
          <router-link
            v-for="item in sidebarNavItems"
            :key="item.to"
            :to="item.to"
            class="ad-bottom-nav__item col"
            :class="{ 'ad-bottom-nav__item--active': isNavActive(item) }"
          >
            <q-icon :name="item.icon" size="22px" />
            <span class="ad-bottom-nav__label">{{ item.label }}</span>
          </router-link>
        </nav>
        <button
          type="button"
          class="ad-bottom-nav__notif col-auto"
          :aria-label="t('app.nav_inbox')"
          @click="notifMenuOpen = true"
        >
          <q-icon name="notifications_none" size="22px" />
          <span v-if="notifUnreadCount > 0" class="ad-bottom-nav__notif-badge" />
          <span class="ad-bottom-nav__label">{{ t('app.nav_inbox_short') }}</span>
        </button>
      </div>
      <q-dialog
        v-model="notifMenuOpen"
        position="bottom"
        class="ad-notif-sheet-dialog"
      >
        <NotificationPopover
          ref="notifDialogPopoverRef"
          show-close
          class="ad-bottom-notif-popover"
          @close="notifMenuOpen = false"
          @view-all="notifMenuOpen = false"
          @loaded="onNotifLoaded"
        />
      </q-dialog>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import AdUserAvatar from 'src/components/ui/AdUserAvatar.vue';
import AiAssistantPanel from 'src/components/AiAssistantPanel.vue';
import AppUserMenu from 'src/components/layout/AppUserMenu.vue';
import LocaleSwitcher from 'src/components/layout/LocaleSwitcher.vue';
import NotificationPopover from 'src/components/layout/NotificationPopover.vue';
import WorkspaceSwitcher from 'src/components/layout/WorkspaceSwitcher.vue';
import { useAppBreadcrumbs } from 'src/composables/useAppBreadcrumbs';
import { useScrollHideBar } from 'src/composables/useScrollHideBar';
import { WORKSPACE_DEFS, type WorkspaceId } from 'src/constants/workspaces';
import { http } from 'src/api/http';
import { unwrapData, type ApiBody } from 'src/api/unwrap';
import { INAPP_UNREAD_BADGE_REFRESH_EVENT } from 'src/utils/inAppUnreadBadge';
import { useAuthStore } from 'stores/auth';
import { useWorkspaceStore } from 'stores/workspace';

const SIDEBAR_MINI_KEY = 'ad-sidebar-mini';

const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const workspace = useWorkspaceStore();
const { items: breadcrumbs } = useAppBreadcrumbs();

const leftDrawerOpen = ref(false);
const sidebarMini = ref(localStorage.getItem(SIDEBAR_MINI_KEY) !== 'expanded');
const drawerWidth = computed(() => (sidebarMini.value ? 72 : 220));
const aiOpen = ref(false);
const workspaceOpen = ref(false);
const notifMenuOpen = ref(false);
const notifMenuPopoverRef = ref<InstanceType<typeof NotificationPopover> | null>(null);
const notifDialogPopoverRef = ref<InstanceType<typeof NotificationPopover> | null>(null);
const notifUnreadCount = ref(0);

const availableWorkspaces = computed(() =>
  auth.canAdmin ? WORKSPACE_DEFS : WORKSPACE_DEFS.filter((ws) => ws.id === 'application'),
);

const sidebarNavItems = computed(() =>
  workspace
    .navItemsFor(workspace.currentId, auth.hasPermission)
    .map((item) => ({
      to: item.to,
      icon: item.icon,
      label: t(item.labelKey),
      exact: item.exact,
    })),
);

/** Chỉ điện thoại (< 600px). Tablet/desktop giữ layout đầy đủ. */
const isPhone = computed(() => !$q.screen.gt.xs);

const showBottomNav = computed(() => isPhone.value);
const { visible: bottomNavVisible, reset: resetBottomNav } = useScrollHideBar(showBottomNav);

function isNavActive(item: { to: string; exact?: boolean | undefined }) {
  if (item.exact) return route.path === item.to;
  return route.path === item.to || route.path.startsWith(`${item.to}/`);
}

function goBack() {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
    return;
  }
  void router.push('/');
}

function onWorkspaceSelect(id: WorkspaceId) {
  workspace.setWorkspace(id);
  void router.push(workspace.homeRoute());
}

const displayName = computed(() => {
  const u = auth.user;
  if (!u) return '';
  return u.fullName?.trim() || u.email;
});

function toggleSidebarSize() {
  sidebarMini.value = !sidebarMini.value;
  localStorage.setItem(SIDEBAR_MINI_KEY, sidebarMini.value ? 'mini' : 'expanded');
}

async function fetchUnreadBadge() {
  if (!auth.isAuthenticated) {
    notifUnreadCount.value = 0;
    return;
  }
  try {
    const { data: body } = await http.get<ApiBody<{ unreadCount: number }>>('/notifications/in-app/unread-count');
    const layer = unwrapData(body) as { unreadCount?: number };
    const n = layer.unreadCount ?? 0;
    notifUnreadCount.value = Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch {
    /* ignore */
  }
}

function onNotifLoaded(n: number) {
  notifUnreadCount.value = Math.max(0, n);
}

function activeNotifPopover() {
  return isPhone.value ? notifDialogPopoverRef.value : notifMenuPopoverRef.value;
}

async function onNotifMenuShow() {
  await activeNotifPopover()?.load?.();
}

watch(notifMenuOpen, (open) => {
  if (open) void nextTick(() => onNotifMenuShow());
});

watch(() => auth.isAuthenticated, (ok) => {
  if (ok) void fetchUnreadBadge();
  else notifUnreadCount.value = 0;
});

watch(
  () => route.path,
  (path) => {
    workspace.syncFromPath(path);
    resetBottomNav();
    if (auth.isAuthenticated) void fetchUnreadBadge();
    if (path === '/notifications/inbox') {
      void activeNotifPopover()?.load?.();
    }
  },
  { immediate: true },
);

function onInAppUnreadBadgeRefreshEvent() {
  void fetchUnreadBadge();
}

onMounted(() => {
  window.addEventListener(INAPP_UNREAD_BADGE_REFRESH_EVENT, onInAppUnreadBadgeRefreshEvent);
  if (auth.isAuthenticated) void fetchUnreadBadge();
});

onUnmounted(() => {
  window.removeEventListener(INAPP_UNREAD_BADGE_REFRESH_EVENT, onInAppUnreadBadgeRefreshEvent);
});

async function logout() {
  notifUnreadCount.value = 0;
  auth.logout();
  try {
    await router.replace('/login');
  } catch {
    /* ignore */
  }
  router.go(0);
}
</script>

<style scoped lang="scss">
@import 'src/css/brand.scss';

.ad-sidebar {
  background: $ad-sidebar-bg !important;
  color: $ad-sidebar-text;
  border-right: 1px solid rgba(255, 255, 255, 0.06) !important;

  :deep(.q-drawer__content) {
    background: $ad-sidebar-bg !important;
  }

  :deep(.q-scrollarea),
  :deep(.q-scrollarea__container),
  :deep(.q-scrollarea__content),
  :deep(.q-list) {
    background: transparent !important;
    color: inherit;
  }

  :deep(.q-item) {
    color: $ad-sidebar-text;
  }

  :deep(.q-separator) {
    background: rgba(255, 255, 255, 0.1) !important;
  }
}

.ad-sidebar-inner {
  background: $ad-sidebar-bg;
}

.ad-sidebar-brand {
  min-height: 64px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0 12px;
}

.ad-sidebar--mini .ad-sidebar-brand {
  padding: 0 8px;
}

.ad-brand-text {
  color: #fff;
  font-size: 0.875rem;
  white-space: nowrap;
}

.ad-sidebar-footer {
  min-height: 48px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.ad-nav-list {
  padding-top: 8px;
}

.ad-nav-item {
  min-height: 48px;
  padding: 6px 8px;
  color: $ad-sidebar-text;
  border-radius: 8px;
  margin: 2px 6px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0;

  :deep(.q-focus-helper) {
    opacity: 0 !important;
  }
}

.ad-sidebar--mini .ad-nav-item {
  min-height: 44px;
  padding: 4px;
  margin: 2px 4px;
}

.ad-sidebar--expanded .ad-nav-item {
  justify-content: flex-start;
  min-height: 48px;
  padding: 8px 14px;
  margin: 2px 8px;
  gap: 12px;
  text-align: left;
}

.ad-nav-icon-wrap {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.ad-nav-item--active {
  color: #fff;

  .ad-nav-icon-wrap {
    background: rgba(21, 101, 192, 0.35);
  }

  .q-icon {
    color: #64b5f6;
  }

  .ad-nav-label {
    font-weight: 600;
    color: #fff;
  }
}

.ad-nav-label {
  font-size: 0.8125rem;
  line-height: 1.2;
  font-weight: 500;
  flex: 1;
  text-align: left;
}

.ad-nav-separator {
  background: rgba(255, 255, 255, 0.1);
}

.ad-page-container {
  background: $ad-page-bg;
  max-width: 100vw;
  overflow-x: clip;

  .q-page {
    background: transparent;
  }

  &--bottom-nav {
    padding-bottom: 64px;
    transition: padding-bottom 0.25s ease;
  }
}

.ad-topbar {
  background: #fff;
  border-bottom: 1px solid $ad-topbar-border;
  padding: 10px 20px;
  min-height: 56px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.ad-breadcrumb {
  font-size: 0.875rem;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
}

.ad-breadcrumb__sep {
  color: #94a3b8;
  margin: 0 2px;
}

.ad-breadcrumb__link {
  color: #64748b;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    color: $ad-blue;
  }
}

.ad-breadcrumb__current {
  color: #1e3a5f;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ai-toolbar-ai-btn {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  padding: 5px 14px;
}

.ad-user-trigger {
  border-radius: 50%;
}

.notif-badge-dot {
  width: 8px;
  height: 8px;
  min-width: 8px;
  min-height: 8px;
  max-width: 8px;
  max-height: 8px;
  padding: 0;
  line-height: 0;
  font-size: 0;
  border-radius: 50%;
  top: 4px;
  right: 4px;
}

.ad-icon-btn--active {
  background: #f1f5f9;
  color: $ad-blue;
}

.ad-icon-btn--sm {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  border-radius: 5px;
}

.ad-topbar-back {
  flex-shrink: 0;
}

.ad-bottom-nav {
  background: #fff;
  padding: 0;
  z-index: 2000;
  transform: translateY(0);
  transition: transform 0.25s ease;

  :deep(.q-layout__shadow) {
    display: none;
  }

  &--hidden {
    transform: translateY(100%);
    pointer-events: none;
  }
}

.ad-bottom-nav__inner {
  min-height: 60px;
  border-top: 1px solid $ad-topbar-border;
}

.ad-bottom-nav__items {
  min-width: 0;
}

.ad-bottom-nav__notif {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 14px;
  min-width: 64px;
  min-height: 60px;
  border: none;
  border-left: 1px solid $ad-topbar-border;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  position: relative;
  font-size: 10px;
  font-weight: 500;
}

.ad-bottom-nav__notif-badge {
  position: absolute;
  top: 8px;
  right: 12px;
  width: 8px;
  height: 8px;
  min-width: 8px;
  min-height: 8px;
  border-radius: 50%;
  background: $ad-green;
}

.ad-topbar-breadcrumb {
  flex-shrink: 0;
}

.ad-bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 4px;
  min-height: 60px;
  color: #64748b;
  text-decoration: none;
  font-size: 10px;
  line-height: 1.2;
  font-weight: 500;
  text-align: center;

  .q-icon {
    color: inherit;
  }

  &--active {
    color: $ad-blue;
    font-weight: 600;
  }
}

.ad-bottom-nav__label {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 2px;
}
</style>
