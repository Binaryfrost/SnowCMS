import { Link, useParams } from 'react-router-dom';
import { Alert } from '@mantine/core';
import DataGetter from '../DataGetter';
import type CollectionInputDTO from '../../../lib/client/dto/collection/input/CollectionInputDTO';
import FormSkeleton from '../FormSkeleton';
import type CollectionEntryDraftSummaryDTO from '../../../lib/client/dto/collection/entry/draft/CollectionEntryDraftSummaryDTO';
import type CollectionEntryDraftWithDataDTO from '../../../lib/client/dto/collection/entry/draft/CollectionEntryDraftWithDataDTO';
import type CollectionEntryWithDataDTO from '../../../lib/client/dto/collection/entry/CollectionEntryWithDataDTO';
import CollectionEntryEditorForm from './CollectionEntryEditorForm';
import type { PaginatedResponse } from '../../../lib/client/types/PaginatedResponse';
import { formatDate } from '../../util/data';
import type CollectionDTO from '../../../lib/client/dto/collection/CollectionDTO';

interface Props {
  entryId?: string
  draftId?: string
}

export default function CollectionEntryForm({ entryId, draftId }: Props) {
  const { websiteId, collectionId } = useParams();

  return (
    <DataGetter.Multiple<[
      CollectionDTO,
      CollectionInputDTO[],
      CollectionEntryWithDataDTO | CollectionEntryDraftWithDataDTO,
      PaginatedResponse<CollectionEntryDraftSummaryDTO>
    ]>
      skeletonComponent={<FormSkeleton />}
      urls={[
        `/api/websites/${websiteId}/collections/${collectionId}`,
        `/api/websites/${websiteId}/collections/${collectionId}/inputs`,
        draftId || entryId ?
          `/api/websites/${websiteId}/collections/${collectionId}/` +
          `${draftId ? 'drafts' : 'entries'}/${draftId || entryId}` : null,
        !draftId && entryId ?
          `/api/websites/${websiteId}/collections/${collectionId}/drafts?entry=${entryId}` : null
      ].filter(Boolean)}>
      {({ data: [collection, inputs, data, drafts] }) => {
        const draftEntryId = draftId ? (data as CollectionEntryDraftWithDataDTO).entryId : null;

        return (
          <>
            {drafts && drafts.drafts.length !== 0 && (
              <Alert mb="sm">
                A draft for this Collection Entry was created
                at {formatDate(new Date(drafts.drafts[0].createdAt * 1000))}.
                Would you like to <Link
                  to={`/websites/${websiteId}/collections/${collectionId}/drafts/${drafts.drafts[0].id}`}>
                  edit that one instead
                </Link>?
              </Alert>
            )}
            <CollectionEntryEditorForm entryId={draftEntryId || entryId} draftId={draftId}
              inputs={inputs} data={data?.data} backdatingEnabled={collection.backdatingEnabled} />
          </>
        );
      }}
    </DataGetter.Multiple>
  );
}
