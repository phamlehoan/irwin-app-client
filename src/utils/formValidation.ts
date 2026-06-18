export type FieldRule = (value: unknown, allValues: Record<string, unknown>) => string | null;

export type FormSchema = Record<string, FieldRule[]>;

export type FormValidationResult = {
  valid: boolean;
  fieldErrors: Record<string, string[]>;
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOPIC_CODE_RE = /^[A-Z][A-Z0-9_]{0,62}$/;

function str(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') {
    return String(v).trim();
  }
  return '';
}

function formatSummary(fieldErrors: Record<string, string[]>): string {
  const parts: string[] = [];
  for (const msgs of Object.values(fieldErrors)) {
    for (const msg of msgs) {
      if (!parts.includes(msg)) parts.push(msg);
    }
  }
  return parts.join('; ');
}

export function validateForm(schema: FormSchema, values: Record<string, unknown>): FormValidationResult {
  const fieldErrors: Record<string, string[]> = {};

  for (const [field, rules] of Object.entries(schema)) {
    for (const rule of rules) {
      const err = rule(values[field], values);
      if (err) {
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err);
        break;
      }
    }
  }

  const message = formatSummary(fieldErrors);
  return { valid: message === '', fieldErrors, message };
}

export const rules = {
  required:
    (message: string) =>
    (value: unknown): string | null =>
      str(value) ? null : message,

  email:
    (message: string) =>
    (value: unknown): string | null => {
      const s = str(value);
      if (!s) return null;
      return EMAIL_RE.test(s) ? null : message;
    },

  minLength:
    (min: number, message: string) =>
    (value: unknown): string | null => {
      const s = str(value);
      if (!s) return null;
      return s.length >= min ? null : message;
    },

  maxLength:
    (max: number, message: string) =>
    (value: unknown): string | null => {
      const s = str(value);
      if (!s) return null;
      return s.length <= max ? null : message;
    },

  match:
    (otherField: string, message: string) =>
    (value: unknown, allValues: Record<string, unknown>): string | null => {
      if (!str(value)) return null;
      return str(value) === str(allValues[otherField]) ? null : message;
    },

  topicCode:
    (message: string) =>
    (value: unknown): string | null => {
      const s = str(value).toUpperCase();
      if (!s) return null;
      return TOPIC_CODE_RE.test(s) ? null : message;
    },

  oneOf:
    (allowed: string[], message: string) =>
    (value: unknown): string | null => {
      const s = str(value);
      if (!s) return null;
      return allowed.includes(s) ? null : message;
    },
};
