import { useContext, useEffect } from 'react';
import { Flex, Paper, Stack, Title } from '@mantine/core';
import { useListState } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
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
import HeaderWithAddButton from '../../components/HeaderWithAddButton';
import { showAddInputModal } from '../../util/modals';
import { WebsiteContext } from '../../context/WebsiteContext';
import { Input } from '../../../common/InputRegistry';

export function Component() {
  const { websiteId, collectionId } = useParams();
  const refresh = useRefresh();
  const actionData = useActionData() as HttpResponse;
  const collectionContext = useContext(CollectionsContext);
  const websiteContext = useContext(WebsiteContext);
  const [inputs, inputsHandlers] = useListState<Input<any>>([]);

  console.log(inputs);

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
                <CollectionTitleForm collection={collection} />
              </FlexGrow>
            </Flex>

            <HeaderWithAddButton titleProps={{
              order: 2,
              children: 'Collection Inputs'
            }} actionIconProps={{
              children: <IconPlus />,
              onClick: () => showAddInputModal({
                website: websiteContext.data,
                collection,
                // TODO: Close modal and open settings (if it exists for this input) and then save input in database
                addInput: (input) => inputsHandlers.append(input)
              })
            }} tooltipLabel="Add Collection Input" />

            <Paper withBorder p="sm">
              {JSON.stringify(inputs)}
            </Paper>
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
