import { ActionFunctionArgs, Form } from 'react-router-dom';
import { Button, Checkbox, MultiSelect, PasswordInput, Select, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { UserWithWebsites } from '../../../common/types/User';
import { formDataToObject, onSubmit } from '../../util/form';
import { ROLE_HIERARCHY } from '../../../common/users';
import DataGetter from '../DataGetter';
import FormSkeleton from '../FormSkeleton';
import { Website } from '../../../common/types/Website';
import { shortenUuid } from '../ShortUuid';

interface Props {
  user?: UserWithWebsites
}

export default function AccountForm({ user }: Props) {
  const form = useForm({
    initialValues: {
      email: user?.email || '',
      password: '',
      confirmPassword: '',
      role: user?.role || 'USER',
      active: user?.active ?? true,
      websites: user?.websites || []
    },
    validate: {
      email: (value) => (!value ? 'Email is required' : null),
      password: (value) => (!user && !value ? 'Password is required' : null),
      confirmPassword: (value, { password }) => {
        if (!user && !value) {
          return 'Password confirmation is required';
        }

        if (password && password !== value) {
          return 'Passwords do not match';
        }

        return null;
      },
      role: (value) => (!value ? 'Role is required' : null)
    },
    validateInputOnChange: true
  });

  const passwordUpdateText = 'Leave password blank to leave unchanged';

  return (
    <DataGetter<Website[]> url="/api/websites" skeletonComponent={<FormSkeleton inputs={6} />}>
      {(websites) => (
        <Form method="POST" onSubmit={(e) => onSubmit(e, form)}>
          <Stack>
            <TextInput label="Email" name="email" type="email" required {...form.getInputProps('email')}
              key={form.key('email')} />

            <PasswordInput label="Password" name="password" required={!user}
              description={passwordUpdateText} {...form.getInputProps('password')}
              key={form.key('password')} />

            <PasswordInput label="Confirm Password" required={!user} description={passwordUpdateText}
              {...form.getInputProps('confirmPassword')} key={form.key('confirmPassword')} />

            <Select label="Role" name="role" required data={Object.keys(ROLE_HIERARCHY)}
              {...form.getInputProps('role')} key={form.key('role')} />

            <Checkbox label="Active" name="active"
              {...form.getInputProps('active', { type: 'checkbox' })} key={form.key('active')} />

            {form.getValues().role !== 'ADMIN' && (
              <MultiSelect label="Websites" name="websites" data={websites.map((w) => ({
                label: `${w.name} (${shortenUuid(w.id)})`,
                value: w.id
              }))} {...form.getInputProps('websites')} key={form.key('websites')} />
            )}

            <Button type="submit">{user ? 'Edit' : 'Create'} Account</Button>
          </Stack>
        </Form>
      )}
    </DataGetter>
  );
}

export async function prepareRequest({ request }: ActionFunctionArgs) {
  const formData = await formDataToObject(request);
  formData.active = formData.active === 'on';
  formData.websites = formData.websites ? formData.websites.split(',') : [];
  return formData;
}
