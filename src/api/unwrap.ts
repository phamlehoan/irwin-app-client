/**
 * warehouse-cloud-server `renderJson` → `{ success: true, data: payload }` (ts-rails ApiResponse.ok).
 */
export type ApiBody<T> = { success: boolean; data: T };

export function unwrapData<T>(body: ApiBody<T>): T {
  return body.data;
}
