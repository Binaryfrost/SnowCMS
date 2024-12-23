import { Stack, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import Page from '../../components/Page';
import HeaderWithAddButton from '../../components/HeaderWithAddButton';
import DataGetter from '../../components/DataGetter';
import { UserWithWebsites } from '../../../common/types/User';
import ListEntry from '../../components/ListEntry';
import useRefresh from '../../util/refresh';

export function Component() {
  const refresh = useRefresh();

  return (
    <Page title="Accounts">
      <HeaderWithAddButton
        link="/accounts/create"
        titleProps={{
          children: 'Accounts'
        }} actionIconProps={{
          children: <IconPlus />
        }} tooltipLabel="Create Account" />

      <DataGetter<UserWithWebsites[]> url="/api/accounts" skeletonProps={{ h: 85 }} skeletonNum={3}>
        {(users) => (
          users.length === 0 ? (
            <Text>No accounts exist</Text>
          ) : (
            <Stack>
              {users.map((user) => (
                <ListEntry key={user.id} type="User" name={user.email} id={user.id} buttons={{
                  delete: {
                    role: 'ADMIN',
                    modal: {
                      refresh,
                      url: `/api/accounts/${user.id}`
                    }
                  },
                  settings: {
                    url: `/accounts/${user.id}/settings`,
                    role: 'ADMIN'
                  }
                }} />
              ))}
            </Stack>
          )
        )}
      </DataGetter>
    </Page>
  );
}
