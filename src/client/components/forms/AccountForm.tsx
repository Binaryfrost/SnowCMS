import { useContext } from 'react';
import { ActionFunctionArgs, Form } from 'react-router-dom';
import { Anchor, Box, Button, Checkbox, MultiSelect, PasswordInput, Select, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import type { UserWithWebsites } from '../../../common/types/User';
import { formDataToObject, onSubmit } from '../../util/form';
import { ROLE_HIERARCHY } from '../../../common/users';
import DataGetter from '../DataGetter';
import FormSkeleton from '../FormSkeleton';
import { Website } from '../../../common/types/Website';
import { shortenUuid } from '../ShortUuid';
import { UserContext } from '../../context/UserContext';

interface Props {
  user?: UserWithWebsites
}

export default function AccountForm({ user }: Props) {
  const loggedInUser = useContext(UserContext);
  const [passwordVisible, { toggle: togglePasswordVisible }] = useDisclosure(false);
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
      role: (value) => {
        if (!value) {
          return 'Role is required';
        }

        if (!user) return null;
        if (user.id === loggedInUser.user.id && value !== loggedInUser.user.role) {
          return 'You cannot change your own role';
        }

        return null;
      },
      active: (value) => {
        if (!user) return null;
        if (value !== user.active) {
          if (loggedInUser.user.id === user.id) {
            return 'You cannot disable your own account';
          }

          if (loggedInUser.user.role !== 'ADMIN') {
            return 'Non-admin users cannot change their account active status';
          }
        }

        return null;
      }
    },
    validateInputOnChange: true
  });

  const passwordUpdateText = 'Leave password blank to leave unchanged';
  const shouldDisableAdminFields = loggedInUser.user.role !== 'ADMIN';

  return (
    <DataGetter<Website[]> url="/api/websites" skeletonComponent={<FormSkeleton inputs={6} />}>
      {(websites) => (
        <Form method="POST" onSubmit={(e) => onSubmit(e, form)}>
          <Stack>
            <TextInput label="Email" name="email" type="email" required {...form.getInputProps('email')}
              key={form.key('email')} />

            <Box>
              <PasswordInput label="Password" name="password" required={!user}
                description={passwordUpdateText} visible={passwordVisible}
                onVisibilityChange={togglePasswordVisible} {...form.getInputProps('password')}
                key={form.key('password')} />
              {typeof crypto !== 'undefined' && (
                <Anchor component="span" fz="xs" style={{
                  userSelect: 'none'
                }} onClick={() => {
                  const password = btoa(
                    [...crypto.getRandomValues(new Uint8Array(12))]
                      .map((e) => String.fromCharCode(e)).join('')
                  ).replace(/=/g, '');

                  form.setFieldValue('password', password);
                  form.setFieldValue('confirmPassword', password);

                  if (!passwordVisible) {
                    togglePasswordVisible();
                  }
                }}>Generate random password</Anchor>
              )}
            </Box>

            <PasswordInput label="Confirm Password" required={!user}
              description={passwordUpdateText} visible={passwordVisible}
              onVisibilityChange={togglePasswordVisible} {...form.getInputProps('confirmPassword')}
              key={form.key('confirmPassword')} />

            <Select label="Role" name="role" required data={Object.keys(ROLE_HIERARCHY)}
              {...form.getInputProps('role')} key={form.key('role')}
              readOnly={shouldDisableAdminFields} />

            <Checkbox label="Active" name="active"
              {...form.getInputProps('active', { type: 'checkbox' })} key={form.key('active')} />

            {form.getValues().role !== 'ADMIN' && (
              <MultiSelect label="Websites" name="websites" data={websites.map((w) => ({
                label: `${w.name} (${shortenUuid(w.id)})`,
                value: w.id
              }))} {...form.getInputProps('websites')} key={form.key('websites')}
                readOnly={shouldDisableAdminFields} />
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
