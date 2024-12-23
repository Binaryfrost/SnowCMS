import { useEffect, useState } from 'react';
import { ActionFunctionArgs, Form, useActionData, useParams } from 'react-router-dom';
import { ActionIcon, Alert, Button, Checkbox, Code, CopyButton, Group, LoadingOverlay, MultiSelect, Select, Stack, Text, TextInput, Tooltip, rem } from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { IconCheck, IconCircleCheck, IconCopy, IconExclamationCircle } from '@tabler/icons-react';
import DataGetter from '../DataGetter';
import type { ApiKeyWithWebsites, Role, UserWithWebsites } from '../../../common/types/User';
import FormSkeleton from '../FormSkeleton';
import { ROLE_HIERARCHY } from '../../../common/users';
import { shortenUuid } from '../ShortUuid';
import { Website } from '../../../common/types/Website';
import { formDataToObject, handleFormResponseNotification, onSubmit } from '../../util/form';
import { HttpResponse, post } from '../../util/api';

interface Props {
  apiKey?: ApiKeyWithWebsites
}

export default function ApiKeyForm({ apiKey }: Props) {
  const { accountId, keyId } = useParams();
  const [newKey, setNewKey] = useState(null);
  const [resetting, setResetting] = useState(false);
  const actionData = useActionData() as HttpResponse;
  const form = useForm({
    initialValues: {
      name: apiKey?.name || '',
      role: apiKey?.role || 'VIEWER',
      active: apiKey?.active ?? true,
      websites: apiKey?.websites || []
    }
  });

  useEffect(() => {
    if (actionData) {
      handleFormResponseNotification(actionData);

      if (actionData.status === 200) {
        const { id, key } = actionData.body;
        if (id) {
          setNewKey(`a:${id}.${key}`);
        }
      }
    }
  }, [actionData]);

  const getAllowedRoles = (userRole: Role) => Object.entries(ROLE_HIERARCHY)
    .filter(([, weight]) => weight <= ROLE_HIERARCHY[userRole])
    .map(([role]) => role);

  return (
    <>
      <LoadingOverlay visible={resetting} />
      {newKey ? (
        <Alert color="green" title="API key created" icon={<IconCircleCheck />} withCloseButton
          onClose={() => {
            setNewKey(null);
          }}>
          <Text mb="sm">
            Keep this API key secret. Do not use it client-side or store it where it may be
            easily stolen (e.g. version control systems such as GitHub).
          </Text>

          <Text mb="sm">The full API key will not be shown again.</Text>

          <Group gap="xs" style={{
            wordBreak: 'break-word'
          }}>
            <Code fz="sm">{newKey}</Code>
            <CopyButton value={newKey} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                  <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                    {copied ? (
                      <IconCheck style={{ width: rem(16) }} />
                    ) : (
                      <IconCopy style={{ width: rem(16) }} />
                    )}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </Alert>
      ) : (
        <DataGetter.Multiple<[UserWithWebsites, Website[]]>
          urls={[`/api/accounts/${accountId}`, '/api/websites']}
          skeletonComponent={<FormSkeleton inputs={2} />}>
          {([user, websites]) => (
            <Form method="POST" onSubmit={(e) => onSubmit(e, form)}>
              <Stack>
                <TextInput label="Name" name="name" required {...form.getInputProps('name')}
                  key={form.key('name')} />

                <Select label="Role" name="role" required data={getAllowedRoles(user.role)}
                  {...form.getInputProps('role')} key={form.key('role')} />

                {form.values.role === 'ADMIN' && (
                  <Alert color="yellow" icon={<IconExclamationCircle />}>
                    API keys with the ADMIN role can perform any action, including deleting websites
                    from the CMS. It is recommended to use a lower role unless the API route(s) your
                    application uses requires the ADMIN role.
                  </Alert>
                )}

                <Checkbox label="Active" name="active"
                  {...form.getInputProps('active', { type: 'checkbox' })} key={form.key('active')} />

                {form.values.role !== 'ADMIN' && (
                  <MultiSelect label="Websites" name="websites" data={websites
                    .filter((w) => (user.role === 'ADMIN' ? true : user.websites.includes(w.id)))
                    .map((w) => ({
                      label: `${w.name} (${shortenUuid(w.id)})`,
                      value: w.id
                    }))} {...form.getInputProps('websites')} key={form.key('websites')} />
                )}

                <Group grow>
                  <Button type="submit">{apiKey ? 'Edit' : 'Create'} API Key</Button>
                  {apiKey && (
                    <Button color="red" onClick={() => {
                      modals.openConfirmModal({
                        title: 'Reset API key',
                        children: 'Are you sure you want to reset this API key? ' +
                        'Any application(s) currently using this key will stop ' +
                        'working until they are updated.',
                        labels: {
                          confirm: 'Reset API key',
                          cancel: 'Cancel'
                        },
                        confirmProps: {
                          color: 'red'
                        },
                        onConfirm: async () => {
                          setResetting(true);

                          const resp = await post(
                            `/api/accounts/${accountId}/keys/${keyId}/reset`, {}
                          );
                          handleFormResponseNotification(resp);
                          setResetting(false);

                          if (resp.status === 200) {
                            const { id, key } = resp.body;
                            setNewKey(`a:${id}.${key}`);
                          }
                        }
                      });
                    }}>Reset API Key</Button>
                  )}
                </Group>
              </Stack>
            </Form>
          )}
        </DataGetter.Multiple>
      )}
    </>
  );
}

export async function prepareRequest({ request }: ActionFunctionArgs) {
  const formData = await formDataToObject(request);
  formData.active = formData.active === 'on';
  formData.websites = formData.websites ? formData.websites.split(',') : [];
  return formData;
}
