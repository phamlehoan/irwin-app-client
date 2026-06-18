import { ref } from 'vue';

import { firstFieldErrorMessages, parseApiError, parseApiErrorBody, type ApiErrorBody } from 'src/api/apiErrors';

export function useFormFieldErrors() {
  const fieldErrors = ref<Record<string, string>>({});

  function clear() {
    fieldErrors.value = {};
  }

  function fieldError(name: string): string {
    return fieldErrors.value[name] ?? '';
  }

  function applyFromBody(body: ApiErrorBody | undefined | null) {
    clear();
    const parsed = parseApiErrorBody(body);
    fieldErrors.value = firstFieldErrorMessages(parsed.fieldErrors);
    return parsed;
  }

  function applyFromUnknown(e: unknown) {
    clear();
    const parsed = parseApiError(e);
    fieldErrors.value = firstFieldErrorMessages(parsed.fieldErrors);
    return parsed;
  }

  function setClientErrors(errors: Record<string, string>) {
    fieldErrors.value = { ...errors };
  }

  return { fieldErrors, clear, fieldError, applyFromBody, applyFromUnknown, setClientErrors };
}
