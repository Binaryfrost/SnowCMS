import { Link, useParams } from 'react-router-dom';
import DataGetter from '../DataGetter';
import { CollectionInput } from '../../../common/types/CollectionInputs';
import FormSkeleton from '../FormSkeleton';
import { CollectionEntryDraftSummary, CollectionEntryDraftWithData, CollectionEntryWithData } from '../../../common/types/CollectionEntry';
import CollectionEntryEditorForm from './CollectionEntryEditorForm';
import { PaginatedResponse } from '../../../common/types/PaginatedResponse';
import { Alert } from '@mantine/core';
import { formatDate } from '../../util/data';
import { Collection } from '../../../common/types/Collection';

interface Props {
  entryId?: string
  draftId?: string
}

export default function CollectionEntryForm({ entryId, draftId }: Props) {
  const { websiteId, collectionId } = useParams();

  return (
    <DataGetter.Multiple<[
      Collection,
      CollectionInput[],
      CollectionEntryWithData | CollectionEntryDraftWithData,
      PaginatedResponse<CollectionEntryDraftSummary>
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
        const draftEntryId = draftId ? (data as CollectionEntryDraftWithData).entryId : null;

        return (
          <>
            {drafts && drafts.data.length !== 0 && (
              <Alert mb="sm">
                A draft for this Collection Entry was created 
                at {formatDate(new Date(drafts.data[0].createdAt * 1000))}.
                Would you like to <Link
                  to={`/websites/${websiteId}/collections/${collectionId}/drafts/${drafts.data[0].id}`}>
                  edit that one instead
                </Link>?
              </Alert>
            )}
            <CollectionEntryEditorForm entryId={draftEntryId || entryId} draftId={draftId}
              inputs={inputs} data={data?.data} backdatingEnabled={collection.backdatingEnabled} />
          </>
        )
      }}
    </DataGetter.Multiple>
  );
}
