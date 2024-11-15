import { useContext, useEffect } from 'react';
import { Title } from '@mantine/core';
import { useActionData, useNavigate, useParams, type ActionFunctionArgs } from 'react-router-dom';
import Page from '../../components/Page';
import CollectionForm from '../../components/forms/CollectionForm';
import { HttpResponse, post } from '../../util/api';
import { formDataToObject, handleFormResponseNotification } from '../../util/form';
import { CollectionsContext } from '../../context/CollectionsContext';

export function Component() {
  const { websiteId } = useParams();
  const navigate = useNavigate();
  const actionData = useActionData() as HttpResponse;
  const collectionContext = useContext(CollectionsContext);

  useEffect(() => {
    if (actionData) {
      handleFormResponseNotification(actionData);

      if (actionData.status === 200) {
        collectionContext.refresh(websiteId);
        navigate(`/websites/${websiteId}/collections/${actionData.body.id}/settings`);
      }
    }
  }, [actionData]);

  return (
    <Page title="Create Collection">
      <Title>Create Collection</Title>
      <CollectionForm />
    </Page>
  );
}

export async function action(args: ActionFunctionArgs) {
  return post(`/api/websites/${args.params.websiteId}/collections`,
    await formDataToObject(args.request));
}
