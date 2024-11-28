import { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Group, Stack, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import HeaderWithAddButton from '../../components/HeaderWithAddButton';
import Page from '../../components/Page';
import { CollectionsContext } from '../../context/CollectionsContext';
import DataGetter from '../../components/DataGetter';
import { CollectionEntryWithTitle } from '../../../common/types/CollectionEntry';
import ListEntry from '../../components/ListEntry';
import { formatDate } from '../../util/data';
import useRefresh from '../../util/refresh';
import SearchInput from '../../components/SearchInput';

export function Component() {
  const { websiteId, collectionId } = useParams();
  const refresh = useRefresh();
  const [search, setSearch] = useState('');
  const collectionsContext = useContext(CollectionsContext);
  const collectionName = collectionsContext.data?.filter((c) => c.id === collectionId)[0].name || 'Loading...';

  return (
    <Page title={`Collection Entries: ${collectionName}`}>
      <Group justify="space-between" mb="sm">
        <HeaderWithAddButton tooltipLabel="Create Collection Entry"
          link={`/websites/${websiteId}/collections/${collectionId}/entries/create`}
          titleProps={{
            children: `Collection Entries: ${collectionName}`
          }}
          actionIconProps={{
            children: (
              <IconPlus />
            )
          }}
          iconButtonProps={{
            role: 'USER'
          }} />
        <SearchInput setSearch={setSearch} />
      </Group>

      <DataGetter<CollectionEntryWithTitle[]> key={collectionId}
        url={`/api/websites/${websiteId}/collections/${collectionId}/entries`}>
        {(entries) => (
          <Stack>
            {entries.length === 0 ? (
              <Text>No Collection Entries exist yet</Text>
            ) : entries
              // We want the newest entries on top
              .sort((a, b) => b.createdAt - a.createdAt)
              .filter((entry) => entry.title?.toLowerCase().includes(search) ||
                entry.id.includes(search))
              .map((entry) => (
                <ListEntry key={entry.id} id={entry.id} name={entry.title || 'Unnamed Entry'}
                  additional={`Created At: ${formatDate(new Date(entry.createdAt * 1000))} | ` +
                    `Updated At: ${formatDate(new Date(entry.updatedAt * 1000))}`}
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
                      url: `/websites/${websiteId}/collections/${collectionId}/entries/${entry.id}`
                    }
                  }} />
              ))}
          </Stack>
        )}
      </DataGetter>
    </Page>
  );
}
