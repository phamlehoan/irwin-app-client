<template>
  <div class="ad-section q-mb-md">
    <div v-if="title || editable || $slots.actions" class="ad-section__head">
      <div class="ad-section__title">{{ title }}</div>
      <slot name="actions">
        <div v-if="editable && editing" class="ad-section__actions row no-wrap q-gutter-sm">
          <q-btn
            flat
            no-caps
            color="primary"
            class="ad-section-action-btn"
            :label="cancelLabel || t('app.cancel')"
            @click="$emit('cancel')"
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="ad-section-action-btn"
            :label="saveLabel || t('app.save')"
            :loading="saving"
            @click="$emit('save')"
          />
        </div>
        <q-btn
          v-else-if="editable"
          flat
          no-caps
          color="primary"
          class="ad-section-edit-btn"
          icon="edit"
          :label="editLabel"
          @click="$emit('edit')"
        />
      </slot>
    </div>
    <div class="ad-section__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

withDefaults(
  defineProps<{
    title?: string;
    editable?: boolean;
    editing?: boolean;
    saving?: boolean;
    editLabel?: string;
    saveLabel?: string;
    cancelLabel?: string;
  }>(),
  { editable: false, editing: false, saving: false, editLabel: '' },
);

defineEmits<{ edit: []; save: []; cancel: [] }>();

const { t } = useI18n();
</script>

<style scoped lang="scss">
.ad-section-edit-btn,
.ad-section-action-btn {
  border: 1px solid var(--ad-blue);
  border-radius: 6px;
  padding: 4px 12px;
}

.ad-section-action-btn.q-btn--unelevated {
  border-color: transparent;
}
</style>
