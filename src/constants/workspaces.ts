export type WorkspaceId = 'application' | 'admin';

export type WorkspaceNavItem = {
  to: string;
  icon: string;
  labelKey: string;
  exact?: boolean;
  permission?: string;
};

export type DashboardTile = {
  to: string;
  icon: string;
  labelKey: string;
  hintKey?: string;
  bg: string;
  permission?: string;
};

export type WorkspaceDef = {
  id: WorkspaceId;
  labelKey: string;
  cardIcon: string;
  homePath: string;
  welcomeShortKey: string;
};

export const WORKSPACE_DEFS: WorkspaceDef[] = [
  {
    id: 'application',
    labelKey: 'app.workspace_application',
    cardIcon: 'home',
    homePath: '/',
    welcomeShortKey: 'app.dashboard_welcome_short',
  },
  {
    id: 'admin',
    labelKey: 'app.workspace_admin',
    cardIcon: 'settings',
    homePath: '/admin',
    welcomeShortKey: 'app.dashboard_admin_welcome_short',
  },
];

export const APPLICATION_NAV: WorkspaceNavItem[] = [
  { to: '/', icon: 'dashboard', labelKey: 'app.nav_dashboard', exact: true },
];

export const ADMIN_NAV: WorkspaceNavItem[] = [
  { to: '/admin', icon: 'dashboard', labelKey: 'app.nav_dashboard', exact: true },
  { to: '/admin/users', icon: 'people', labelKey: 'app.nav_users', permission: 'USM::READ' },
  { to: '/admin/roles', icon: 'admin_panel_settings', labelKey: 'app.nav_roles', permission: 'RAP::READ' },
  {
    to: '/notifications/settings',
    icon: 'notifications_active',
    labelKey: 'app.nav_notif_settings',
    permission: 'NOT::READ',
  },
];

const NAV_TILE_HINTS: Partial<Record<string, string>> = {
  'app.nav_users': 'app.dashboard_admin_users_hint',
  'app.nav_roles': 'app.dashboard_admin_roles_hint',
  'app.nav_notif_settings': 'app.dashboard_admin_notif_hint',
};

const NAV_TILE_BG: Partial<Record<string, string>> = {
  people: '#f9a825',
  admin_panel_settings: '#7ac141',
  notifications_active: '#ab47bc',
};

function navToDashboardTiles(items: WorkspaceNavItem[], homePath: string): DashboardTile[] {
  return items
    .filter((item) => item.to !== homePath)
    .map((item): DashboardTile => {
      const hintKey = NAV_TILE_HINTS[item.labelKey];
      return {
        to: item.to,
        icon: item.icon,
        labelKey: item.labelKey,
        bg: NAV_TILE_BG[item.icon] ?? '#1565c0',
        ...(hintKey ? { hintKey } : {}),
        ...(item.permission ? { permission: item.permission } : {}),
      };
    });
}

export function navItemsFor(
  workspaceId: WorkspaceId,
  hasPermission: (p: string) => boolean,
): WorkspaceNavItem[] {
  const items = workspaceId === 'admin' ? ADMIN_NAV : APPLICATION_NAV;
  return items.filter((item) => !item.permission || hasPermission(item.permission));
}

export function isAdminPath(path: string): boolean {
  return path.startsWith('/admin') || path.startsWith('/notifications/settings');
}

/** Tile dashboard = sidebar trừ trang dashboard (home) của workspace. */
export function dashboardTilesFor(
  workspaceId: WorkspaceId,
  hasPermission: (p: string) => boolean,
): DashboardTile[] {
  const homePath = defaultHomeForWorkspace(workspaceId);
  return navToDashboardTiles(navItemsFor(workspaceId, hasPermission), homePath);
}

export function defaultHomeForWorkspace(workspaceId: WorkspaceId): string {
  return WORKSPACE_DEFS.find((ws) => ws.id === workspaceId)?.homePath ?? '/';
}
