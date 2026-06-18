/**
 * Định dạng ngày/giờ thống nhất theo locale i18n (vi: dd/MM/yyyy 24h; en: dd/MM/yyyy 24h).
 */
function localeTagFor(i18nLocale: string | undefined): string {
  const raw = (i18nLocale || 'vi-VN').replace('_', '-');
  if (raw.toLowerCase().startsWith('vi')) return 'vi-VN';
  if (raw.toLowerCase().startsWith('en')) return 'en-GB';
  return raw;
}

export function formatDateTime(
  iso: string | Date | null | undefined,
  i18nLocale?: string,
): string {
  if (iso == null || iso === '') return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '—';
  const loc = localeTagFor(i18nLocale);
  return new Intl.DateTimeFormat(loc, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function formatDateOnly(
  iso: string | Date | null | undefined,
  i18nLocale?: string,
): string {
  if (iso == null || iso === '') return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '—';
  const loc = localeTagFor(i18nLocale);
  return new Intl.DateTimeFormat(loc, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}
