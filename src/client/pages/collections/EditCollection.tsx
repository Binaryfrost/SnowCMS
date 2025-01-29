import { useContext, useEffect } from 'react';
import { Stack, Title } from '@mantine/core';
import { useListState } from '@mantine/hooks';
import { useActionData, useParams, type ActionFunctionArgs } from 'react-router-dom';
import Page from '../../components/Page';
import CollectionForm, { prepareData } from '../../components/forms/CollectionForm';
import { type HttpResponse, put } from '../../util/api';
import { formDataToObject, handleFormResponseNotification } from '../../util/form';
import { CollectionsContext } from '../../context/CollectionsContext';
import DataGetter from '../../components/DataGetter';
import type { Collection } from '../../../common/types/Collection';
import FormSkeleton from '../../components/FormSkeleton';
import useRefresh from '../../util/refresh';
import CollectionInputsForm from '../../components/forms/CollectionInputsForm';
import type { CollectionInput } from '../../../common/types/CollectionInputs';

interface EditCollectionPageProps {
  collection: Collection
  collectionInputs: CollectionInput[]
}

function EditCollectionPage({ collection, collectionInputs }:
  EditCollectionPageProps) {
  const [inputs, inputsHandlers] = useListState<CollectionInput>(collectionInputs);

  return (
    <Stack>
      <CollectionForm collection={collection} collectionInputs={collectionInputs} />

      <CollectionInputsForm collection={collection} inputs={inputs}
        inputsHandlers={inputsHandlers} />
    </Stack>
  );
}

export function Component() {
  const { websiteId, collectionId } = useParams();
  const refresh = useRefresh();
  const actionData = useActionData() as HttpResponse;
  const collectionContext = useContext(CollectionsContext);

  useEffect(() => {
    if (actionData) {
      handleFormResponseNotification(actionData);

      if (actionData.status === 200) {
        collectionContext.refresh(websiteId);
        refresh();
      }
    }
  }, [actionData]);

  return (
    <Page title="Edit Collection">
      <Title>Edit Collection</Title>
      <DataGetter.Multiple<[Collection, CollectionInput[]]> urls={[
        `/api/websites/${websiteId}/collections/${collectionId}`,
        `/api/websites/${websiteId}/collections/${collectionId}/inputs`
      ]}
        key={collectionId} skeletonComponent={<FormSkeleton inputs={1} />}>
        {({ data: [collection, inputs] }) => (
          <EditCollectionPage collection={collection} collectionInputs={inputs} />
        )}
      </DataGetter.Multiple>
    </Page>
  );
}

export async function action(args: ActionFunctionArgs) {
  const data = await formDataToObject(args.request);
  return put(
    `/api/websites/${args.params.websiteId}/collections/${args.params.collectionId}`,
    prepareData(data)
  );
}
