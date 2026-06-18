<template>
  <teleport to="body">
    <transition name="workspace-fade">
      <div
        v-if="modelValue"
        class="workspace-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="t('app.workspace_switch_title')"
        @click.self="close"
        @keydown.esc="close"
      >
        <div class="workspace-grid" @click.stop>
          <button
            v-for="ws in workspaces"
            :key="ws.id"
            type="button"
            class="workspace-tile"
            :class="{ 'workspace-tile--active': ws.id === currentId }"
            @click="select(ws.id)"
          >
            <span
              class="workspace-tile__icon-box"
              :class="`workspace-tile__icon-box--${ws.id}`"
            >
              <q-icon :name="ws.cardIcon" size="36px" />
            </span>
            <span class="workspace-tile__label">{{ t(ws.labelKey) }}</span>
          </button>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { WorkspaceDef, WorkspaceId } from 'src/constants/workspaces';

const props = defineProps<{
  modelValue: boolean;
  workspaces: WorkspaceDef[];
  currentId: WorkspaceId;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  select: [id: WorkspaceId];
}>();

const { t } = useI18n();

function close() {
  emit('update:modelValue', false);
}

function select(id: WorkspaceId) {
  emit('select', id);
  close();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) close();
}

watch(
  () => props.modelValue,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : '';
  },
);

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = '';
});
</script>

<style scoped lang="scss">
@import 'src/css/brand.scss';

// Ubuntu Focal: ô vuông bo góc trên nền tối; màu/icon đồng bộ sidebar + topbar AD
.workspace-overlay {
  position: fixed;
  inset: 0;
  z-index: 6000;
  background: rgba($ad-sidebar-bg, 0.82);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px 24px;
}

.workspace-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: 48px 64px;
}

.workspace-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-width: 168px;
  padding: 28px 32px 24px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;

  &:focus-visible {
    outline: none;
    border-color: rgba($ad-blue, 0.65);
    box-shadow: 0 0 0 1px rgba($ad-blue, 0.35);
  }

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(255, 255, 255, 0.42);
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22);
  }

  &:active {
    transform: translateY(0);
  }

  &--active {
    border-color: rgba($ad-blue, 0.6);
    background: rgba($ad-blue, 0.14);
    box-shadow:
      0 0 0 1px rgba($ad-blue, 0.28),
      0 10px 28px rgba(0, 0, 0, 0.24);
  }

  &--active .workspace-tile__label {
    color: #fff;
    font-weight: 600;
  }
}

.workspace-tile__icon-box {
  width: 88px;
  height: 88px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid $ad-topbar-border;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.2),
    0 6px 20px rgba(0, 0, 0, 0.22);

  &--application {
    color: $ad-blue;
  }

  &--admin {
    color: $ad-sidebar-text;
  }
}

.workspace-tile--active .workspace-tile__icon-box--application {
  background: #f0f7ff;
  color: $ad-blue-dark;
  border-color: rgba($ad-blue, 0.45);
}

.workspace-tile--active .workspace-tile__icon-box--admin {
  background: #f8fafc;
  color: $ad-blue;
  border-color: rgba($ad-blue, 0.45);
}

.workspace-tile__label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
  text-align: center;
  line-height: 1.35;
  max-width: 132px;
}

@media (max-width: 599px) {
  .workspace-grid {
    gap: 36px 40px;
  }

  .workspace-tile {
    min-width: 140px;
    padding: 22px 24px 20px;
    border-radius: 22px;
  }

  .workspace-tile__icon-box {
    width: 76px;
    height: 76px;
    border-radius: 8px;
  }

  .workspace-tile__label {
    font-size: 0.875rem;
    max-width: 108px;
  }
}

.workspace-fade-enter-active,
.workspace-fade-leave-active {
  transition: opacity 0.2s ease;

  .workspace-tile {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }
}

.workspace-fade-enter-from,
.workspace-fade-leave-to {
  opacity: 0;

  .workspace-tile {
    opacity: 0;
    transform: scale(0.96);
  }
}
</style>
