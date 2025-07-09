import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ActionIcon, Group, Stack, Text } from '@mantine/core';
import { IconDeviceFloppy, IconPlus } from '@tabler/icons-react';
import HeaderWithAddButton from '../../components/HeaderWithAddButton';
import Page from '../../components/Page';
import DataGetter from '../../components/DataGetter';
import { CollectionEntryWithMetadata } from '../../../common/types/CollectionEntry';
import ListEntry from '../../components/ListEntry';
import { formatDate } from '../../util/data';
import useRefresh from '../../util/refresh';
import SearchInput from '../../components/SearchInput';
import { Collection } from '../../../common/types/Collection';
import { PaginatedResponse } from '../../../common/types/PaginatedResponse';
import Pagination from '../../components/Pagination';
import IconButton from '../../components/IconButton';

export function Component() {
  const { websiteId, collectionId } = useParams();
  const refresh = useRefresh();
  const [search, setSearch] = useState('');

  return (
    <DataGetter<Collection> url={`/api/websites/${websiteId}/collections/${collectionId}`}
      key={collectionId}>
      {({ data: collection }) => (
        <Page title={`Collection Entries: ${collection.name}`}>
          <Group justify="space-between" mb="sm">
            <HeaderWithAddButton tooltipLabel="Create Collection Entry"
              link={`/websites/${websiteId}/collections/${collectionId}/entries/create`}
              titleProps={{
                children: `Collection Entries: ${collection.name}`
              }}
              actionIconProps={{
                children: (
                  <IconPlus />
                )
              }}
              iconButtonProps={{
                role: 'USER'
              }} additionalButtons={(
                <IconButton label="Drafts">
                  <ActionIcon component={Link}
                    to={`/websites/${websiteId}/collections/${collectionId}/drafts`}>
                    <IconDeviceFloppy />
                  </ActionIcon>
                </IconButton>
              )} />
            <SearchInput setSearch={setSearch} />
          </Group>

          <DataGetter<PaginatedResponse<CollectionEntryWithMetadata>> key={collectionId} paginate
            url={`/api/websites/${websiteId}/collections/${collectionId}/entries`} sort="desc"
            search={search}>
            {({ data: entries, setPage }) => (
              <Stack>
                {entries.page === 1 && entries.data.length === 0 ? (
                  <Text>No Collection Entries exist yet or search returned empty result</Text>
                ) : (
                  <>
                    {entries.data
                      .map((entry) => (
                        <ListEntry key={entry.id} id={entry.id} name={entry.title || 'Unnamed Entry'}
                          additional={`Created At: ${formatDate(
                            new Date(entry.createdAt * 1000)
                          )} | Updated At: ${formatDate(new Date(entry.updatedAt * 1000))}`}
                          type="Collection Entry" buttons={{
                            delete: {
                              role: 'USER',
                              keepTypeCase: true,
                              modal: {
                                refresh,
                                url: `/api/websites/${websiteId}/collections/${collectionId}/` +
                                  `entries/${entry.id}`
                              }
                            },
                            enter: {
                              url: `/websites/${websiteId}/collections/${collectionId}/` +
                                `entries/${entry.id}`
                            }
                          }} />
                      ))}

                    <Pagination page={entries.page} pages={entries.pages} setPage={setPage} />
                  </>
                )}
              </Stack>
            )}
          </DataGetter>
        </Page>
      )}
    </DataGetter>
  );
}
