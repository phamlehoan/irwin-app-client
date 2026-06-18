import type { QNotifyCreateOptions } from 'quasar';

import { firstFieldErrorMessages, notifyApiError, type ParsedApiError } from 'src/api/apiErrors';
import type { useFormFieldErrors } from 'src/composables/useFormFieldErrors';
import { validateForm, type FormSchema } from 'src/utils/formValidation';

type FieldErrorsApi = Pick<
  ReturnType<typeof useFormFieldErrors>,
  'clear' | 'applyFromUnknown' | 'applyFromBody' | 'fieldError'
> & {
  setClientErrors: (errors: Record<string, string>) => void;
};

export function runClientValidation(
  fieldErrors: FieldErrorsApi,
  schema: FormSchema,
  values: Record<string, unknown>,
  $q: { notify: (opts: QNotifyCreateOptions) => unknown },
  fallbackMessage = 'Validation failed',
): boolean {
  const result = validateForm(schema, values);
  if (result.valid) {
    fieldErrors.clear();
    return true;
  }
  fieldErrors.setClientErrors(firstFieldErrorMessages(result.fieldErrors));
  const parsed: ParsedApiError = { message: result.message, fieldErrors: result.fieldErrors };
  notifyApiError($q, parsed, fallbackMessage);
  return false;
}
