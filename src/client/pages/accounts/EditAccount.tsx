import { useEffect, useState } from 'react';
import { type ActionFunctionArgs, useActionData, useParams, useLocation } from 'react-router-dom';
import { Stack, Tabs, Text, Title, rem } from '@mantine/core';
import { IconPlus, IconUser, IconUserCode } from '@tabler/icons-react';
import Page from '../../components/Page';
import DataGetter from '../../components/DataGetter';
import { ApiKeyWithWebsites, UserWithWebsites } from '../../../common/types/User';
import FormSkeleton from '../../components/FormSkeleton';
import AccountForm, { prepareRequest } from '../../components/forms/AccountForm';
import { type HttpResponse, put } from '../../util/api';
import { handleFormResponseNotification } from '../../util/form';
import HeaderWithAddButton from '../../components/HeaderWithAddButton';
import ListEntry from '../../components/ListEntry';
import { shortenUuid } from '../../components/ShortUuid';
import useRefresh from '../../util/refresh';

export function Component() {
  const { accountId } = useParams();
  const refresh = useRefresh();
  const location = useLocation();
  const [tab, setTab] = useState(location.hash.substring(1) || 'account');
  const actionData = useActionData() as HttpResponse;

  useEffect(() => {
    setTab(location.hash.substring(1) || 'account');
  }, [location]);

  useEffect(() => {
    if (actionData) {
      handleFormResponseNotification(actionData);
    }
  }, [actionData]);

  const iconStyle = { width: rem(20), height: rem(20) };

  return (
    <Page title="Account Settings">
      <Title>Account Settings</Title>

      <Tabs key={accountId} value={tab} onChange={(v) => {
        setTab(v);
        window.location.hash = v;
      }} keepMounted={false}>
        <Tabs.List mb="xs" grow>
          <Tabs.Tab value="account" leftSection={<IconUser style={iconStyle} />}>
            Account
          </Tabs.Tab>
          <Tabs.Tab value="keys" leftSection={<IconUserCode style={iconStyle} />}>
            API Keys
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="account">
          <Title order={2}>Edit Account</Title>

          <DataGetter<UserWithWebsites> url={`/api/accounts/${accountId}`}
            skeletonComponent={<FormSkeleton />}>
            {(user) => (
              <AccountForm user={user} />
            )}
          </DataGetter>
        </Tabs.Panel>

        <Tabs.Panel value="keys">
          <HeaderWithAddButton titleProps={{
            order: 2,
            children: 'API Keys'
          }} actionIconProps={{
            children: <IconPlus />,
          }} tooltipLabel="Create API Key"
            link={`/accounts/${accountId}/settings/keys/create`} />

          <Text mb="sm">
            API keys are used to programmatically access the SnowCMS API.
            Only the key IDs are shown below, the full API key is only shown
            once after creating the API key.
          </Text>

          <DataGetter<ApiKeyWithWebsites[]> url={`/api/accounts/${accountId}/keys`}
            skeletonProps={{ h: 85 }} skeletonNum={3}>
            {(keys) => (
              keys.length === 0 ? (
                <Text>No API keys exist yet</Text>
              ) : (
                <Stack>
                  {keys.map((k) => (
                    <ListEntry key={k.id} type="API Key"
                      name={shortenUuid(k.id)} id={k.id}
                      additional={`Role: ${k.role}`} buttons={{
                        delete: {
                          keepTypeCase: true,
                          modal: {
                            refresh,
                            url: `/api/accounts/${accountId}/keys/${k.id}`
                          },
                          role: 'USER'
                        },
                        settings: {
                          role: 'USER',
                          url: `/accounts/${accountId}/settings/keys/${k.id}/settings`
                        }
                      }} />
                  ))}
                </Stack>
              )
            )}
          </DataGetter>
        </Tabs.Panel>
      </Tabs>
    </Page>
  );
}

export async function action(args: ActionFunctionArgs) {
  return put(`/api/accounts/${args.params.accountId}`, await prepareRequest(args));
}
