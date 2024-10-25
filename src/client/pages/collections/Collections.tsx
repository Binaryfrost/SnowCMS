/* eslint-disable no-nested-ternary */
import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { IconPlus } from '@tabler/icons-react';
import { Stack, Text } from '@mantine/core';
import Page from '../../components/Page';
import HeaderWithAddButton from '../../components/HeaderWithAddButton';
import ListEntry from '../../components/forms/ListEntry';
import useRefresh from '../../util/refresh';
import { CollectionContext } from '../../context/CollectionsContext';
import GenericSkeleton from '../../components/GenericSkeleton';

export function Component() {
  const { websiteId } = useParams();
  const refresh = useRefresh();
  // Data is already loaded from navbar, so no need to refresh it here
  const collectionContext = useContext(CollectionContext);

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

      {collectionContext.loading ? (
        <GenericSkeleton skeletonProps={{ h: 80 }} skeletonNum={3} />
      ) : (
        collectionContext.error ? <Text c="red">{collectionContext.error}</Text> : (
          collectionContext.collections.length === 0 ? (
            <Text>No Collections exist, or you do not have access to any</Text>
          ) : (
            <Stack>
              {collectionContext.collections.map((collection) => (
                <ListEntry key={collection.id} type="Collection" name={collection.name}
                  id={collection.id}
                  buttons={{
                    delete: {
                      modal: {
                        url: `/api/websites/${websiteId}/collections/${collection.id}`,
                        refresh
                      },
                      role: 'SUPERUSER'
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
          )
        )
      )}
    </Page>
  );
}
