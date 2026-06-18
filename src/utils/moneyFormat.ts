/** Định dạng số tiền / đơn giá (vue-tsc nhận import trong template ổn định hơn function nội bộ). */
export function formatDecimalMoney(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}

export function formatMoneyOrDash(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return formatDecimalMoney(v);
}

/** Số tiền hiển thị kèm đơn vị VND. */
export function formatVndAmount(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `${formatDecimalMoney(n)} VND`;
}

export function formatMoneyOrDashVnd(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return formatVndAmount(v);
}
