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
import CollectionTitleForm from '../../components/forms/CollectionTitleForm';
import useRefresh from '../../util/refresh';
import CollectionInputsForm from '../../components/forms/CollectionInputsForm';
import type { CollectionInput } from '../../../common/types/CollectionInputs';
import { CollectionTitle } from '../../../common/types/CollectionTitle';

interface EditCollectionPageProps {
  collection: Collection
  collectionInputs: CollectionInput[]
  collectionTitle: CollectionTitle
}

function EditCollectionPage({ collection, collectionInputs, collectionTitle }:
  EditCollectionPageProps) {
  const [inputs, inputsHandlers] = useListState<CollectionInput>(collectionInputs);

  return (
    <Stack>
      <CollectionForm collection={collection} />
      <CollectionTitleForm collectionTitle={collectionTitle} inputs={inputs} />

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
      <DataGetter.Multiple<[Collection, CollectionInput[], CollectionTitle]> urls={[
        `/api/websites/${websiteId}/collections/${collectionId}`,
        `/api/websites/${websiteId}/collections/${collectionId}/inputs`,
        `/api/websites/${websiteId}/collections/${collectionId}/title`
      ]}
        key={collectionId} skeletonComponent={<FormSkeleton inputs={1} />}>
        {({ data: [collection, inputs, title] }) => (
          <EditCollectionPage collection={collection} collectionInputs={inputs}
            collectionTitle={title} />
        )}
      </DataGetter.Multiple>
    </Page>
  );
}

export async function action(args: ActionFunctionArgs) {
  const { form, ...data } = await formDataToObject(args.request);
  const apiRoot = `/api/websites/${args.params.websiteId}/collections/${args.params.collectionId}`;

  switch (form) {
    case 'name':
      return put(apiRoot, prepareData(data));
    case 'title':
      return put(`${apiRoot}/title`, {
        inputId: data.title
      });
    default:
      console.error('Not implemented yet');
      return null;
  }
}
