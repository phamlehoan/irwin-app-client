import type { Ref } from 'vue';

export type AdTablePaginationState = {
  page?: number;
  rowsPerPage?: number;
  rowsNumber?: number;
  sortBy?: string | null;
  descending?: boolean;
};

export type AdTablePaginationChange = {
  page?: number;
  rowsPerPage?: number;
};

export function applyAdTablePaginationChange(
  pagination: Ref<AdTablePaginationState>,
  payload?: AdTablePaginationChange,
) {
  if (!payload) return;
  pagination.value = {
    ...pagination.value,
    ...(payload.page !== undefined ? { page: payload.page } : {}),
    ...(payload.rowsPerPage !== undefined ? { rowsPerPage: payload.rowsPerPage } : {}),
  };
}
