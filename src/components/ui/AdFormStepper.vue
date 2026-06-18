<template>
  <div class="ad-form-stepper" role="tablist" aria-label="Steps">
    <div
      v-for="(step, idx) in steps"
      :key="idx"
      class="ad-form-stepper__item"
      :class="{
        'ad-form-stepper__item--active': idx === current,
        'ad-form-stepper__item--done': idx < current,
        'ad-form-stepper__item--last': idx === steps.length - 1,
      }"
      role="presentation"
    >
      <span class="ad-form-stepper__bullet" aria-hidden="true">
        <q-icon v-if="idx < current" name="check" size="14px" />
        <template v-else>{{ idx + 1 }}</template>
      </span>
      <span class="ad-form-stepper__label">{{ step }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    steps: string[];
    current?: number;
  }>(),
  { current: 0 },
);
</script>

<style scoped lang="scss">
@import 'src/css/brand.scss';

.ad-form-stepper {
  display: flex;
  align-items: stretch;
  width: 100%;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.ad-form-stepper__item {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 8px 20px 8px 16px;
  color: #64748b;
  font-size: 0.8125rem;
  font-weight: 500;
  background: #fff;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%);

  &:first-child {
    clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%);
    padding-left: 14px;
  }

  &--last {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 14px 50%);
    padding-right: 14px;
  }

  &--active {
    background: $ad-blue;
    color: #fff;
    font-weight: 600;
    z-index: 2;

    .ad-form-stepper__bullet {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.45);
      color: #fff;
    }
  }

  &--done:not(&--active) {
    color: $ad-blue;

    .ad-form-stepper__bullet {
      border-color: rgba($ad-blue, 0.35);
      color: $ad-blue;
    }
  }
}

.ad-form-stepper__bullet {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid #cbd5e1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 700;
  flex-shrink: 0;
}

.ad-form-stepper__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 599px) {
  .ad-form-stepper__label {
    display: none;
  }

  .ad-form-stepper__item {
    padding-left: 10px;
    padding-right: 16px;
  }
}
</style>
