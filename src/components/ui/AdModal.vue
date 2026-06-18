<template>
  <q-dialog
    :model-value="modelValue"
    :persistent="persistent"
    class="ad-modal-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="ad-modal" :style="cardStyle">
      <header class="ad-modal__header row items-center no-wrap">
        <div class="col min-w-0">
          <h2 class="ad-modal__title">{{ title }}</h2>
          <p v-if="subtitle" class="ad-modal__subtitle">{{ subtitle }}</p>
        </div>
        <q-btn
          flat
          dense
          icon="close"
          class="ad-icon-btn ad-icon-btn--sm ad-modal__close"
          :aria-label="t('app.btn_close')"
          v-close-popup
        />
      </header>

      <AdFormStepper
        v-if="steps.length"
        :steps="steps"
        :current="currentStep"
        class="ad-modal__stepper"
      />

      <div class="ad-modal__body">
        <slot />
      </div>

      <footer v-if="$slots.footer || showFooter" class="ad-modal__footer row items-center justify-end q-gutter-sm">
        <slot name="footer">
          <q-btn flat no-caps color="primary" class="ad-btn-outline" :label="cancelLabel || t('app.cancel')" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="saveLabel || t('app.save')"
            :loading="saving"
            @click="emit('save')"
          />
        </slot>
      </footer>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AdFormStepper from 'src/components/ui/AdFormStepper.vue';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    subtitle?: string;
    steps?: string[];
    currentStep?: number;
    maxWidth?: string;
    persistent?: boolean;
    showFooter?: boolean;
    saving?: boolean;
    cancelLabel?: string;
    saveLabel?: string;
  }>(),
  {
    subtitle: '',
    steps: () => [],
    currentStep: 0,
    maxWidth: '820px',
    persistent: false,
    showFooter: true,
    saving: false,
    cancelLabel: '',
    saveLabel: '',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [];
}>();

const { t } = useI18n();

const cardStyle = computed(() => ({
  width: `min(${props.maxWidth}, 96vw)`,
  maxWidth: props.maxWidth,
}));
</script>
