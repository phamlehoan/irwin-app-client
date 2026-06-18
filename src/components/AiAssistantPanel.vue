<template>
  <q-dialog
    :model-value="modelValue"
    class="ai-panel-dialog"
    content-class="ai-panel-dialog__inner"
    position="right"
    full-height
    transition-show="slide-left"
    transition-hide="slide-right"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="ai-panel-card column no-wrap full-height">
      <q-bar class="ai-panel-bar ai-panel-header-fixed bg-primary text-white row items-center no-wrap">
        <q-icon name="auto_awesome" class="q-mr-sm" />
        <div class="ai-panel-title col ellipsis">{{ t('app.ai_title') }}</div>
        <q-btn
          dense
          flat
          round
          icon="delete_sweep"
          color="white"
          :disable="loading || !canClear"
          :aria-label="t('app.ai_clear_chat')"
          @click="clearConversation"
        >
          <q-tooltip>{{ t('app.ai_clear_chat') }}</q-tooltip>
        </q-btn>
        <q-btn v-close-popup dense flat round icon="close" color="white" />
      </q-bar>

      <q-card-section class="ai-panel-messages q-pa-md q-gutter-y-md">
        <div v-if="!messages.length" class="text-grey-7 text-body2">{{ t('app.ai_empty') }}</div>
        <div v-for="(m, idx) in messages" :key="idx" class="q-mb-sm">
          <div class="text-caption text-grey-7">{{ m.role === 'user' ? t('app.ai_you') : t('app.ai_bot') }}</div>
          <div
            v-if="m.role === 'assistant'"
            class="ai-md text-body2 q-pa-sm rounded-borders bg-grey-2"
            v-html="renderMd(m.content)"
          />
          <div v-else class="text-body2 q-pa-sm rounded-borders bg-blue-1">{{ m.content }}</div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="ai-panel-footer q-pa-sm">
        <div v-if="pendingImages.length" class="row q-gutter-xs q-mb-xs">
          <q-chip
            v-for="(p, i) in pendingImages"
            :key="i"
            removable
            dense
            color="secondary"
            text-color="white"
            @remove="removePendingImage(i)"
          >
            {{ p.name }}
          </q-chip>
        </div>
        <div class="row q-gutter-xs items-end">
          <q-btn flat dense round icon="attach_file" :disable="loading" @click="fileInput?.click()" />
          <input
            ref="fileInput"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            class="hidden"
            multiple
            @change="onFiles"
          />
          <q-input
            v-model="draft"
            class="col"
            dense
            outlined
            autogrow
            :disable="loading"
            :placeholder="t('app.ai_placeholder')"
            @keydown.enter.exact.prevent="send"
          />
          <q-btn color="primary" dense round icon="send" :loading="loading" :disable="!canSend" @click="send" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { http } from 'src/api/http';
import { unwrapData, type ApiBody } from 'src/api/unwrap';

marked.setOptions({ breaks: true, gfm: true });

defineProps<{ modelValue: boolean }>();
defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();

const { t } = useI18n();
const $q = useQuasar();

type Role = 'user' | 'assistant';
type Msg = { role: Role; content: string };
type PendingImg = { name: string; mimeType: string; dataBase64: string };

const CHAT_SESSION_KEY = 'smartwarehouse_ai_chat_messages_v1';

function loadChatFromSession(): Msg[] {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(CHAT_SESSION_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is Msg =>
        !!m &&
        typeof m === 'object' &&
        (m as Msg).role !== undefined &&
        ((m as Msg).role === 'user' || (m as Msg).role === 'assistant') &&
        typeof (m as Msg).content === 'string',
    );
  } catch {
    return [];
  }
}

function saveChatToSession(msgs: Msg[]) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(msgs));
  } catch {
    /* quota hoặc private mode */
  }
}

const messages = ref<Msg[]>(loadChatFromSession());

watch(messages, (v) => saveChatToSession(v), { deep: true });
const draft = ref('');
const loading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const pendingImages = ref<PendingImg[]>([]);

const canSend = computed(
  () => !loading.value && (draft.value.trim().length > 0 || pendingImages.value.length > 0),
);

const canClear = computed(
  () =>
    messages.value.length > 0 ||
    draft.value.trim().length > 0 ||
    pendingImages.value.length > 0,
);

function clearConversation() {
  if (!canClear.value) return;
  $q.dialog({
    title: t('app.ai_clear_title'),
    message: t('app.ai_clear_message'),
    ok: { label: t('app.ai_clear_confirm'), color: 'negative', flat: true },
    cancel: { label: t('app.no'), flat: true },
  }).onOk(() => {
    messages.value = [];
    draft.value = '';
    pendingImages.value = [];
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem(CHAT_SESSION_KEY);
      } catch {
        /* ignore */
      }
    }
    $q.notify({ type: 'positive', message: t('app.ai_clear_done'), timeout: 1600 });
  });
}

function renderMd(md: string) {
  const raw = marked.parse(md || '', { async: false });
  const html = typeof raw === 'string' ? raw : '';
  return DOMPurify.sanitize(html);
}

function removePendingImage(i: number) {
  pendingImages.value.splice(i, 1);
}

async function onFiles(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const files = input.files;
  if (!files?.length) return;
  for (const file of Array.from(files).slice(0, 4 - pendingImages.value.length)) {
    if (!file.type.startsWith('image/')) continue;
    if (file.size > 2 * 1024 * 1024) {
      $q.notify({ type: 'warning', message: t('app.ai_image_too_large') });
      continue;
    }
    const dataUrl = await readFileAsDataUrl(file);
    const m = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
    const mimeType = m?.[1];
    const dataBase64 = m?.[2];
    if (!mimeType || !dataBase64) continue;
    pendingImages.value.push({
      name: file.name,
      mimeType,
      dataBase64,
    });
  }
  input.value = '';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const v = r.result;
      resolve(typeof v === 'string' ? v : '');
    };
    r.onerror = () => reject(new Error('File read failed'));
    r.readAsDataURL(file);
  });
}

async function send() {
  if (!canSend.value) return;
  const text = draft.value.trim();
  const imgs = pendingImages.value.map((p) => ({
    mimeType: p.mimeType,
    dataBase64: p.dataBase64,
  }));

  const userLine = text || (imgs.length ? t('app.ai_image_only') : '');
  messages.value.push({ role: 'user', content: userLine });
  draft.value = '';
  pendingImages.value = [];
  loading.value = true;

  try {
    const payload = {
      messages: messages.value.map((m) => ({ role: m.role, content: m.content })),
      images: imgs.length ? imgs : undefined,
    };
    const { data: body } = await http.post<ApiBody<{ reply: string }>>('/ai/chat', payload);
    const data = unwrapData(body);
    const reply = typeof data?.reply === 'string' ? data.reply : '';
    messages.value.push({ role: 'assistant', content: reply || t('app.ai_empty_reply') });
  } catch (e: unknown) {
    const ax = e as { response?: { data?: { error?: string; message?: string } } };
    const msg = ax.response?.data?.error || ax.response?.data?.message;
    $q.notify({
      type: 'negative',
      message: typeof msg === 'string' && msg ? msg : t('app.ai_error'),
    });
    messages.value.push({
      role: 'assistant',
      content: t('app.ai_error_turn'),
    });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.ai-panel-card {
  width: min(100vw, 440px);
  max-width: 100vw;
  /* 100dvh có thể tính sai trên WebKit iOS 15.x và ghi đè 100vh. */
  height: 100vh;
  max-height: 100vh;
  min-height: 100vh;
}
.ai-panel-header-fixed,
.ai-panel-footer {
  flex: 0 0 auto;
}
.ai-panel-messages {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.ai-panel-bar {
  z-index: 1;
  min-height: 44px;
  padding: 4px 8px;
}
.ai-panel-title {
  line-height: 1.2;
  font-weight: 600;
}
.hidden {
  display: none;
}
.ai-md :deep(p) {
  margin: 0.35em 0;
}
.ai-md :deep(ul),
.ai-md :deep(ol) {
  margin: 0.35em 0 0.35em 1.2em;
}
.ai-md :deep(pre) {
  overflow: auto;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
}
.ai-md :deep(table) {
  border-collapse: collapse;
  width: 100%;
}
.ai-md :deep(th),
.ai-md :deep(td) {
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 4px 6px;
}
</style>
