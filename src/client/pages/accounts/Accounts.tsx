import { Stack, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import Page from '../../components/Page';
import HeaderWithAddButton from '../../components/HeaderWithAddButton';
import DataGetter from '../../components/DataGetter';
import { UserWithWebsites } from '../../../common/types/User';
import ListEntry from '../../components/ListEntry';
import useRefresh from '../../util/refresh';
import { PaginatedResponse } from '../../../common/types/PaginatedResponse';
import Pagination from '../../components/Pagination';

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

      <DataGetter<PaginatedResponse<UserWithWebsites>> url="/api/accounts" paginate
        skeletonProps={{ h: 85 }} skeletonNum={3}>
        {({ data: users, setPage }) => (
          users.page === 1 && users.data.length === 0 ? (
            <Text>No accounts exist</Text>
          ) : (
            <Stack>
              {users.data.map((user) => (
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

              <Pagination page={users.page} pages={users.pages} setPage={setPage} />
            </Stack>
          )
        )}
      </DataGetter>
    </Page>
  );
}
