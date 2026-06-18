<template>
  <div class="ad-table-no-data">
    <q-icon name="inbox" size="2rem" color="grey-5" />
    <span class="text-body2">{{ t('app.table_no_data') }}</span>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
.ad-table-no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 160px;
  padding: 2rem 1rem;
  color: #94a3b8;
  text-align: center;
}
</style>
