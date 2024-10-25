import type { UseFormReturnType } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import type { FormEvent } from 'react';
import type { HttpResponse } from './api';

export function onSubmit(e: FormEvent<HTMLFormElement>, form: UseFormReturnType<any, any>) {
  if (form.validate().hasErrors) {
    e.preventDefault();
  }
}

export async function formDataToObject(request: Request): Promise<Record<string, any>> {
  return Object.fromEntries((await request.formData()).entries());
}

export function handleFormResponseNotification(resp: HttpResponse) {
  if (resp.status === 200) {
    notifications.show({
      message: resp.body.message
    });
  } else {
    notifications.show({
      message: resp.body.error || 'An error occurred',
      color: 'red'
    });
  }
}
