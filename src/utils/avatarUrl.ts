const apiBase = (import.meta.env.VITE_CLOUD_API_URL || '').replace(/\/$/, '');

/** Bảng màu avatar cố định — cùng seed luôn ra cùng màu trên mọi màn hình. */
export const AVATAR_COLOR_PALETTE = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
  '#4f46e5',
  '#9333ea',
] as const;

const DEFAULT_AVATAR_COLOR: string = AVATAR_COLOR_PALETTE[0];

export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function avatarColorFromSeed(seed: string): string {
  const key = seed.trim().toLowerCase();
  if (!key) return DEFAULT_AVATAR_COLOR;
  return AVATAR_COLOR_PALETTE[hashString(key) % AVATAR_COLOR_PALETTE.length] ?? DEFAULT_AVATAR_COLOR;
}

export function resolveAvatarUrl(avatarUrl?: string | null): string {
  const u = avatarUrl?.trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('//')) return `https:${u}`;
  return `${apiBase}${u.startsWith('/') ? '' : '/'}${u}`;
}

export function userInitialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  }
  return (name[0] || '?').toUpperCase();
}

export function avatarSeedFromUser(input: {
  id?: string | null;
  email?: string | null;
  name?: string | null;
}): string {
  return (input.id || input.email || input.name || '').trim();
}
