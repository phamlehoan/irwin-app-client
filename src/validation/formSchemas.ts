import type { ComposerTranslation } from 'vue-i18n';

import { rules, type FormSchema } from 'src/utils/formValidation';

type T = ComposerTranslation;

export function loginSchema(t: T): FormSchema {
  return {
    email: [
      rules.required(t('validation.email_required')),
      rules.email(t('validation.email_invalid')),
    ],
    password: [rules.required(t('validation.password_required'))],
  };
}

export function forgotPasswordSchema(t: T): FormSchema {
  return {
    email: [
      rules.required(t('validation.email_required')),
      rules.email(t('validation.email_invalid')),
    ],
  };
}

export function passwordPairSchema(t: T, min = 8): FormSchema {
  const minMsg = t('validation.password_min', { n: min });
  return {
    password: [rules.required(t('validation.password_required')), rules.minLength(min, minMsg)],
    passwordConfirmation: [
      rules.required(t('validation.password_confirm_required')),
      rules.minLength(min, minMsg),
      rules.match('password', t('validation.password_mismatch')),
    ],
  };
}

export function changePasswordSchema(t: T, requireOld: boolean): FormSchema {
  const minMsg = t('validation.password_min', { n: 8 });
  const schema: FormSchema = {
    newPassword: [rules.required(t('validation.password_required')), rules.minLength(8, minMsg)],
    newPasswordConfirmation: [
      rules.required(t('validation.password_confirm_required')),
      rules.minLength(8, minMsg),
      rules.match('newPassword', t('validation.password_mismatch')),
    ],
  };
  if (requireOld) {
    schema.oldPassword = [rules.required(t('validation.current_password_required'))];
  }
  return schema;
}

export function adminUserCreateSchema(t: T): FormSchema {
  return {
    firstName: [rules.required(t('validation.first_name_required'))],
    lastName: [rules.required(t('validation.last_name_required'))],
    email: [
      rules.required(t('validation.email_required')),
      rules.email(t('validation.email_invalid')),
    ],
  };
}

export function adminUserUpdateSchema(t: T, requireStatus: boolean): FormSchema {
  const schema = adminUserCreateSchema(t);
  if (requireStatus) {
    schema.status = [
      rules.required(t('app.user_status_required')),
      rules.oneOf(['ACTIVE', 'INACTIVE'], t('app.user_status_required')),
    ];
  }
  return schema;
}

export function adminRoleSchema(t: T): FormSchema {
  return {
    code: [rules.required(t('validation.code_required'))],
    name: [rules.required(t('validation.name_required'))],
  };
}

export function notificationTopicCreateSchema(t: T): FormSchema {
  return {
    code: [
      rules.required(t('validation.code_required')),
      rules.topicCode(t('validation.topic_code_invalid')),
    ],
    name: [rules.required(t('validation.name_required'))],
  };
}

export function profileSchema(t: T): FormSchema {
  return {
    firstName: [rules.required(t('validation.first_name_required'))],
    lastName: [rules.required(t('validation.last_name_required'))],
    middleName: [rules.maxLength(120, t('validation.max_length', { n: 120 }))],
    gender: [rules.maxLength(32, t('validation.max_length', { n: 32 }))],
    phoneNumber: [rules.maxLength(40, t('validation.max_length', { n: 40 }))],
    address: [rules.maxLength(500, t('validation.max_length', { n: 500 }))],
  };
}

export function notificationTopicManualSaveSchema(t: T, cronEnabled: boolean): FormSchema {
  const schema: FormSchema = {
    name: [rules.required(t('validation.name_required'))],
  };
  if (cronEnabled) {
    schema.cronSchedule = [rules.required(t('validation.cron_required'))];
  }
  return schema;
}
