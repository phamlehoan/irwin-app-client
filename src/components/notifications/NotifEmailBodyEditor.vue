<template>
  <div class="notif-email-body-editor">
    <p v-if="isMobile" class="text-caption text-grey-7 q-mb-sm">
      {{ t('app.notif_email_body_mobile_hint') }}
    </p>
    <div
      class="ad-md-editor-shell notif-email-body-editor__wysiwyg"
      :class="{ 'ad-md-editor-shell--single': isMobile }"
    >
      <MdEditor
        :key="editorKey"
        :model-value="modelValue"
        :editor-id="editorId"
        :preview="showSplitPreview"
        :read-only="readOnly"
        :height="editorHeight"
        language="en-US"
        preview-theme="github"
        :toolbars="isMobile ? mobileToolbars : desktopToolbars"
        class="notif-email-body-editor__md"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <div v-if="isMobile" class="notif-email-body-editor__mobile-bar row items-center justify-end">
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          :icon="mobilePreviewOpen ? 'edit_note' : 'visibility'"
          :label="mobilePreviewOpen ? t('app.notif_email_back_edit') : t('app.notif_email_preview_btn')"
          @click="mobilePreviewOpen = !mobilePreviewOpen"
        />
      </div>
    </div>
    <q-slide-transition>
      <div
        v-if="isMobile && mobilePreviewOpen"
        class="notif-email-body-editor__mobile-preview q-mt-sm"
      >
        <div class="notif-email-body-editor__mobile-preview-label text-caption text-grey-7 q-mb-xs">
          {{ t('app.notif_email_preview_label') }}
        </div>
        <MdPreview
          :model-value="modelValue"
          :editor-id="`${editorId}-mobile-preview`"
          preview-theme="github"
          language="en-US"
        />
      </div>
    </q-slide-transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MdEditor, MdPreview, type ToolbarNames } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';

defineProps<{
  modelValue: string;
  editorId: string;
  editorKey: string;
  readOnly?: boolean;
  error?: string;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const { t } = useI18n();
const $q = useQuasar();

const mobilePreviewOpen = ref(false);

const isMobile = computed(() => !$q.screen.gt.sm);
const showSplitPreview = computed(() => $q.screen.gt.sm);
const editorHeight = computed(() => (isMobile.value ? 'min(72vh, 380px)' : '420px'));

watch(isMobile, (mobile) => {
  if (!mobile) mobilePreviewOpen.value = false;
});

/** Mobile: không dùng nút Preview của thư viện (layout split lỗi); dùng thanh Xem trước bên dưới. */
const mobileToolbars: ToolbarNames[] = [
  'bold',
  'italic',
  'strikeThrough',
  'title',
  'quote',
  'unorderedList',
  'orderedList',
  'link',
  'image',
  'code',
  'revoke',
  'next',
];

const desktopToolbars: ToolbarNames[] = [
  'bold',
  'underline',
  'italic',
  'strikeThrough',
  'title',
  'sub',
  'sup',
  'quote',
  'unorderedList',
  'orderedList',
  'task',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  'revoke',
  'next',
  'preview',
  'prettier',
];
</script>

<style scoped lang="scss">
.notif-email-body-editor {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.notif-email-body-editor__wysiwyg,
.notif-email-body-editor__md {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.notif-email-body-editor__mobile-bar {
  padding: 4px 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: #fafafa;
}

.notif-email-body-editor__mobile-preview {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  padding: 12px;
  background: #fff;
  max-width: 100%;
  overflow-x: auto;
}

.notif-email-body-editor__mobile-preview :deep(.md-editor-preview) {
  padding: 0;
}
</style>
