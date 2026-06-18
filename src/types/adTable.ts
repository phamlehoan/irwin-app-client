export type AdTableFilterOption = { label: string; value: string };

export type AdTableFilterField = {
  key: string;
  label: string;
  type: 'select' | 'text';
  options?: AdTableFilterOption[];
  placeholder?: string;
  /** Hiển thị badge trong select (vd. status). */
  badge?: 'status';
};

export type AdTableFilterValues = Record<string, string>;
