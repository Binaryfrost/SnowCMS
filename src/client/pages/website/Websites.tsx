import { IconPlus } from '@tabler/icons-react';
import { Stack, Text } from '@mantine/core';
import Page from '../../components/Page';
import HeaderWithAddButton from '../../components/HeaderWithAddButton';
import { type Website } from '../../../common/types/Website';
import DataGetter from '../../components/DataGetter';
import useRefresh from '../../util/refresh';
import ListEntry from '../../components/ListEntry';

export function Component() {
  const refresh = useRefresh();

  return (
    <Page title="Websites">
      <HeaderWithAddButton tooltipLabel="Create Website" link="/websites/create"
        titleProps={{
          children: 'Websites'
        }}
        actionIconProps={{
          children: (
            <IconPlus />
          )
        }}
        iconButtonProps={{
          role: 'ADMIN'
        }} />
      <DataGetter<Website[]> url="/api/websites" skeletonProps={{ h: 85 }} skeletonNum={3}>
        {(websites) => (
          websites.length === 0 ? (
            <Text>No websites exist, or you do not have access to any</Text>
          ) : (
            <Stack>
              {websites.map((website) => (
                <ListEntry key={website.id} type="Website" name={website.name} id={website.id}
                  buttons={{
                    delete: {
                      modal: {
                        url: `/api/websites/${website.id}`,
                        refresh
                      },
                      role: 'ADMIN'
                    },
                    settings: {
                      url: `/websites/${website.id}/settings`,
                      role: 'SUPERUSER'
                    },
                    enter: {
                      url: `/websites/${website.id}/collections`
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