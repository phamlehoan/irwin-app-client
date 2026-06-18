import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  navItemsFor,
  type WorkspaceId,
  type WorkspaceNavItem,
  defaultHomeForWorkspace,
  isAdminPath,
} from 'src/constants/workspaces';

const STORAGE_KEY = 'ad-workspace';

function readStoredWorkspace(): WorkspaceId {
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'admin' ? 'admin' : 'application';
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const currentId = ref<WorkspaceId>(readStoredWorkspace());

  const isAdmin = computed(() => currentId.value === 'admin');

  function setWorkspace(id: WorkspaceId) {
    currentId.value = id;
    localStorage.setItem(STORAGE_KEY, id);
  }

  function syncFromPath(path: string) {
    const next: WorkspaceId = isAdminPath(path) ? 'admin' : 'application';
    if (currentId.value !== next) {
      currentId.value = next;
      localStorage.setItem(STORAGE_KEY, next);
    }
  }

  function navItemsForWorkspace(
    workspaceId: WorkspaceId,
    hasPermission: (p: string) => boolean,
  ): WorkspaceNavItem[] {
    return navItemsFor(workspaceId, hasPermission);
  }

  function homeRoute(): string {
    return defaultHomeForWorkspace(currentId.value);
  }

  return {
    currentId,
    isAdmin,
    setWorkspace,
    syncFromPath,
    navItemsFor: navItemsForWorkspace,
    homeRoute,
  };
});
