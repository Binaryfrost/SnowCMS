import { Group, Stack, Text, Title, TypographyStylesProvider } from '@mantine/core';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Page from '../../../components/Page';
import SearchInput from '../../../components/SearchInput';
import DataGetter from '../../../components/DataGetter';
import type { PaginatedResponse } from '../../../../lib/client/types/PaginatedResponse';
import type CollectionEntryDraftSummaryDTO from '../../../../lib/client/dto/collection/entry/draft/CollectionEntryDraftSummaryDTO';
import ListEntry from '../../../components/ListEntry';
import { formatDate } from '../../../util/data';
import useRefresh from '../../../util/refresh';
import Pagination from '../../../components/Pagination';
import ShortUuid, { shortenUuid } from '../../../components/ShortUuid';

export function Component() {
  const { websiteId, collectionId } = useParams();
  const refresh = useRefresh();
  const [search, setSearch] = useState('');

  return (
    <Page title="Drafts">
      <Group justify="space-between" mb="sm">
        <Title>Drafts</Title>
        <SearchInput setSearch={setSearch} />
      </Group>

      <DataGetter<PaginatedResponse<CollectionEntryDraftSummaryDTO>> key={collectionId} paginate
        url={`/api/websites/${websiteId}/collections/${collectionId}/drafts`} sort="desc"
        search={search}>
        {({ data: entries, setPage }) => (
          <Stack>
            {entries._metadata.page === 1 && entries.drafts.length === 0 ? (
              <Text>No drafts exist yet or search returned empty result</Text>
            ) : (
              <>
                {entries.drafts
                  .map((entry) => (
                    <ListEntry key={entry.id} id={entry.id} name={entry.title || 'Unnamed Entry'}
                      additional={(
                        <Group align="start">
                          <Text c="dimmed" mb="0">Created At: {formatDate(new Date(entry.createdAt * 1000))}</Text>
                          <Text c="dimmed" mb="0">Updated At: {formatDate(new Date(entry.updatedAt * 1000))}</Text>
                          {entry.entryId && (
                            <Text c="dimmed" mb="0">
                              Draft of <Link to={`/websites/${websiteId}/collections/${collectionId}/entries/${entry.entryId}`}>
                                {shortenUuid(entry.entryId)}
                              </Link>
                            </Text>
                          )}
                        </Group>
                      )}
                      type="draft" buttons={{
                        delete: {
                          role: 'USER',
                          keepTypeCase: true,
                          modal: {
                            refresh,
                            url: `/api/websites/${websiteId}/collections/${collectionId}/` +
                              `drafts/${entry.id}`
                          }
                        },
                        enter: {
                          url: `/websites/${websiteId}/collections/${collectionId}/` +
                            `drafts/${entry.id}`
                        }
                      }} />
                  ))}

                <Pagination page={entries._metadata.page} pages={entries._metadata.pages}
                  setPage={setPage} />
              </>
            )}
          </Stack>
        )}
      </DataGetter>
    </Page>
  );
}
