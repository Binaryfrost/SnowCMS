import { useContext, useEffect } from 'react';
import { Flex, Stack, Title } from '@mantine/core';
import { useListState } from '@mantine/hooks';
import { useActionData, useParams, type ActionFunctionArgs } from 'react-router-dom';
import Page from '../../components/Page';
import CollectionForm from '../../components/forms/CollectionForm';
import { HttpResponse, put } from '../../util/api';
import { formDataToObject, handleFormResponseNotification } from '../../util/form';
import { CollectionsContext } from '../../context/CollectionsContext';
import DataGetter from '../../components/DataGetter';
import type { Collection } from '../../../common/types/Collection';
import FormSkeleton from '../../components/FormSkeleton';
import CollectionTitleForm from '../../components/forms/CollectionTitleForm';
import FlexGrow from '../../components/FlexGrow';
import useRefresh from '../../util/refresh';
import CollectionInputsForm from '../../components/forms/CollectionInputsForm';
import type { CollectionInput } from '../../../common/types/CollectionInputs';

export function Component() {
  const { websiteId, collectionId } = useParams();
  const refresh = useRefresh();
  const actionData = useActionData() as HttpResponse;
  const collectionContext = useContext(CollectionsContext);
  // TODO: Get Inputs for this form on load. If an Input is no longer in the registry, show an error in place of the Input in the list
  const [inputs, inputsHandlers] = useListState<CollectionInput>([]);

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
      <DataGetter<Collection> url={`/api/websites/${websiteId}/collections/${collectionId}`}
        key={collectionId} skeletonComponent={<FormSkeleton inputs={1} />}>
        {(collection) => (
          <Stack>
            <Flex direction={{ base: 'column', sm: 'row' }} gap="sm">
              <FlexGrow>
                <CollectionForm collection={collection} />
              </FlexGrow>
              <FlexGrow>
                <CollectionTitleForm collection={collection} inputs={inputs} />
              </FlexGrow>
            </Flex>

            <CollectionInputsForm collection={collection} inputs={inputs}
              inputsHandlers={inputsHandlers} />
          </Stack>
        )}
      </DataGetter>
    </Page>
  );
}

export async function action(args: ActionFunctionArgs) {
  const { form, ...data } = await formDataToObject(args.request);
  switch (form) {
    case 'name':
      return put(`/api/websites/${args.params.websiteId}/collections/${args.params.collectionId}`,
        data);
    // case 'title':
    default:
      console.error('Not implemented yet');
      return null;
  }
}
