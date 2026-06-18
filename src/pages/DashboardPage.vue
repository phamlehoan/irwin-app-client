<template>
  <q-page class="ad-page q-pa-lg">
    <div class="ad-dash-greeting">
      <div class="ad-dash-greeting__hello">{{ helloLine }}</div>
      <div class="ad-dash-greeting__sub">{{ welcomeSubtitle }}</div>
    </div>

    <div v-if="tiles.length" class="row q-col-gutter-lg justify-center">
      <div
        v-for="tile in tiles"
        :key="tile.to"
        class="col-6 col-sm-4 col-md-3"
        style="max-width: 220px"
      >
        <div class="ad-dash-tile" @click="go(tile.to)">
          <div class="ad-dash-tile__icon" :style="{ background: tile.bg }">
            <q-icon :name="tile.icon" size="28px" color="white" />
          </div>
          <div class="ad-dash-tile__label">{{ t(tile.labelKey) }}</div>
          <div v-if="tile.hintKey" class="ad-dash-tile__hint">{{ t(tile.hintKey) }}</div>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-grey-7 text-body2 q-py-xl">
      {{ t('app.dashboard_no_tiles') }}
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  WORKSPACE_DEFS,
  dashboardTilesFor,
  type WorkspaceId,
} from 'src/constants/workspaces';
import { useAuthStore } from 'stores/auth';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const dashboardWorkspace = computed((): WorkspaceId =>
  route.path === '/admin' ? 'admin' : 'application',
);

const helloLine = computed(() => {
  const u = auth.user;
  const name = u?.fullName?.trim() || u?.email || t('app.dashboard_guest');
  return t('app.dashboard_hello', { name });
});

const welcomeSubtitle = computed(() => {
  const key = WORKSPACE_DEFS.find((ws) => ws.id === dashboardWorkspace.value)?.welcomeShortKey;
  return t(key ?? 'app.dashboard_welcome_short');
});

const tiles = computed(() => dashboardTilesFor(dashboardWorkspace.value, auth.hasPermission));

function go(path: string) {
  if (route.path === path) return;
  void router.push(path);
}
</script>
