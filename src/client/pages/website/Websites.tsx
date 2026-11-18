import { IconPlus } from '@tabler/icons-react';
import { Stack, Text } from '@mantine/core';
import Page from '../../components/Page';
import HeaderWithAddButton from '../../components/HeaderWithAddButton';
import type WebsiteDTO from '../../../lib/client/dto/website/WebsiteDTO';
import DataGetter from '../../components/DataGetter';
import useRefresh from '../../util/refresh';
import ListEntry from '../../components/ListEntry';
import type { PaginatedResponse } from '../../../lib/client/types/PaginatedResponse';
import Pagination from '../../components/Pagination';

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
      <DataGetter<PaginatedResponse<WebsiteDTO>> url="/api/websites" paginate
        skeletonProps={{ h: 85 }} skeletonNum={3}>
        {({ data: websites, setPage }) => (
          <Stack>
            {websites.websites.length === 0 ? (
              <Text>No websites exist, or you do not have access to any</Text>
            ) : (
              websites.websites.map((website) => (
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
              ))
            )}
            <Pagination page={websites._metadata.page} pages={websites._metadata.pages}
              setPage={setPage} />
          </Stack>
        )}
      </DataGetter>
    </Page>
  );
}
