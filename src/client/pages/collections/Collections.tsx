/* eslint-disable no-nested-ternary */
import { useParams } from 'react-router-dom';
import { IconPlus } from '@tabler/icons-react';
import { Stack } from '@mantine/core';
import Page from '../../components/Page';
import HeaderWithAddButton from '../../components/HeaderWithAddButton';
import ListEntry from '../../components/ListEntry';
import useRefresh from '../../util/refresh';
import CollectionsGetter from '../../components/CollectionsGetter';

export function Component() {
  const { websiteId } = useParams();
  const refresh = useRefresh();

  return (
    <Page title="Collections">
      <HeaderWithAddButton tooltipLabel="Create Collection"
        link={`/websites/${websiteId}/collections/create`}
        titleProps={{
          children: 'Collections'
        }}
        actionIconProps={{
          children: (
            <IconPlus />
          )
        }}
        iconButtonProps={{
          role: 'SUPERUSER'
        }} />

      {/* Data is already loaded from navbar, so no need to refresh it here */}
      <CollectionsGetter skeleton={{ skeletonProps: { h: 80 }, skeletonNum: 3 }}>
        {(collections) => (
          <Stack>
            {collections.map((collection) => (
              <ListEntry key={collection.id} type="Collection" name={collection.name}
                id={collection.id}
                buttons={{
                  delete: {
                    modal: {
                      url: `/api/websites/${websiteId}/collections/${collection.id}`,
                      refresh
                    },
                    role: 'SUPERUSER',
                    keepTypeCase: true
                  },
                  settings: {
                    url: `/websites/${websiteId}/collections/${collection.id}/settings`,
                    role: 'SUPERUSER'
                  },
                  enter: {
                    url: `/websites/${websiteId}/collections/${collection.id}/entries`
                  }
                }} />
            ))}
          </Stack>
        )}
      </CollectionsGetter>
    </Page>
  );
}
