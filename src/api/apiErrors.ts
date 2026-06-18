import axios, { type AxiosError } from 'axios';
import type { QNotifyCreateOptions } from 'quasar';

export type ApiErrorBody = {
  success?: boolean;
  error?: string;
  errors?: Record<string, string | string[]>;
  message?: string;
};

export type ParsedApiError = {
  message: string;
  fieldErrors: Record<string, string[]>;
};

function normalizeFieldErrors(
  errors?: Record<string, string | string[]> | null,
): Record<string, string[]> {
  if (!errors || typeof errors !== 'object') return {};
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (Array.isArray(value)) {
      const msgs = value.filter((m): m is string => typeof m === 'string' && m.trim().length > 0);
      if (msgs.length) out[key] = msgs;
      continue;
    }
    if (typeof value === 'string' && value.trim()) {
      out[key] = [value.trim()];
    }
  }
  return out;
}

function formatFieldErrorSummary(fieldErrors: Record<string, string[]>): string {
  const parts: string[] = [];
  for (const msgs of Object.values(fieldErrors)) {
    for (const msg of msgs) {
      if (!parts.includes(msg)) parts.push(msg);
    }
  }
  return parts.join('; ');
}

export function parseApiErrorBody(body: ApiErrorBody | undefined | null): ParsedApiError {
  const fieldErrors = normalizeFieldErrors(body?.errors);
  const fieldSummary = formatFieldErrorSummary(fieldErrors);
  const generic =
    (typeof body?.error === 'string' && body.error.trim()) ||
    (typeof body?.message === 'string' && body.message.trim()) ||
    '';
  const message = fieldSummary || generic || (body?.success === false ? 'Validation failed' : '');
  return { message, fieldErrors };
}

export function parseApiError(e: unknown): ParsedApiError {
  if (axios.isAxiosError(e)) {
    const body = e.response?.data as ApiErrorBody | undefined;
    const parsed = parseApiErrorBody(body);
    if (parsed.message) return parsed;
    if (e.message && !/^Request failed with status code \d+$/.test(e.message)) {
      return { message: e.message, fieldErrors: {} };
    }
    const status = e.response?.status;
    if (status === 422) {
      return { message: 'Validation failed', fieldErrors: {} };
    }
    return { message: e.message || 'Request failed', fieldErrors: {} };
  }
  if (e instanceof Error) {
    return { message: e.message, fieldErrors: {} };
  }
  return { message: String(e), fieldErrors: {} };
}

export function firstFieldErrorMessages(fieldErrors: Record<string, string[]>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(fieldErrors)) {
    const first = msgs[0];
    if (first) out[key] = first;
  }
  return out;
}

export function notifyApiError(
  $q: { notify: (opts: QNotifyCreateOptions) => unknown },
  parsed: ParsedApiError,
  fallback = 'Request failed',
  position?: QNotifyCreateOptions['position'],
) {
  const opts: QNotifyCreateOptions = {
    type: 'negative',
    message: parsed.message || fallback,
  };
  if (position) opts.position = position;
  $q.notify(opts);
}

export function isAxiosErrorWithBody(e: unknown): e is AxiosError<ApiErrorBody> {
  return axios.isAxiosError(e);
}

export function resolveSubmitError(
  body: ApiErrorBody | undefined | null,
  applyFromBody: (body: ApiErrorBody | undefined | null) => ParsedApiError,
  options?: { fallback?: string; mapCode?: (code: string) => string | undefined },
): string {
  const parsed = applyFromBody(body);
  if (Object.keys(parsed.fieldErrors).length > 0) {
    return parsed.message || options?.fallback || '';
  }
  const code = typeof body?.error === 'string' ? body.error.trim() : '';
  if (code && options?.mapCode) {
    const mapped = options.mapCode(code);
    if (mapped) return mapped;
  }
  return parsed.message || code || options?.fallback || '';
}
