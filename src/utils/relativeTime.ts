function localeTagFor(i18nLocale: string | undefined): string {
  const raw = (i18nLocale || 'vi-VN').replace('_', '-');
  if (raw.toLowerCase().startsWith('vi')) return 'vi-VN';
  if (raw.toLowerCase().startsWith('en')) return 'en-US';
  return raw;
}

/** e.g. "6 days ago" / "6 ngày trước" */
export function formatRelativeTime(
  iso: string | Date | null | undefined,
  i18nLocale?: string,
): string {
  if (iso == null || iso === '') return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  const loc = localeTagFor(i18nLocale);
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(loc, { numeric: 'auto' });
  if (abs < 60) return rtf.format(diffSec, 'second');
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), 'day');
  if (abs < 86400 * 365) return rtf.format(Math.round(diffSec / (86400 * 30)), 'month');
  return rtf.format(Math.round(diffSec / (86400 * 365)), 'year');
}
