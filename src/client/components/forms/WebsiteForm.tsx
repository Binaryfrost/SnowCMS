import { ActionFunctionArgs, Form } from 'react-router-dom';
import { Button, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { Website } from '../../../common/types/Website';
import { formDataToObject, onSubmit } from '../../util/form';

interface Props {
  website?: Website
}

export default function WebsiteForm({ website }: Props) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: website?.name || '',
      hook: website?.hook || ''
    }
  });

  return (
    <Form method="POST" onSubmit={(e) => onSubmit(e, form)}>
      <Stack>
        <TextInput label="Name" name="name" required
          {...form.getInputProps('name')} key={form.key('name')} />
        <TextInput label="Hook" name="hook" type="url"
          description="A POST request will be sent to this URL whenever a Collection Entry is created, modified, or deleted"
          {...form.getInputProps('hook')} key={form.key('hook')} />
        <Button type="submit">{website ? 'Edit' : 'Create'} Website</Button>
      </Stack>
    </Form>
  );
}

export async function prepareRequest({ request }: ActionFunctionArgs) {
  const formData = await formDataToObject(request);
  formData.hook = formData.hook === '' ? null : formData.hook;
  return formData;
}
