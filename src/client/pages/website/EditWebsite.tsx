import { Title } from '@mantine/core';
import { useActionData, useNavigate, useParams, type ActionFunctionArgs } from 'react-router-dom';
import { useEffect } from 'react';
import Page from '../../components/Page';
import WebsiteForm, { prepareRequest } from '../../components/forms/WebsiteForm';
import { type HttpResponse, put } from '../../util/api';
import { handleFormResponseNotification } from '../../util/form';
import DataGetter from '../../components/DataGetter';
import { type Website } from '../../../common/types/Website';
import FormSkeleton from '../../components/FormSkeleton';

export function Component() {
  const { websiteId } = useParams();
  const navigate = useNavigate();
  const actionData = useActionData() as HttpResponse;

  useEffect(() => {
    if (actionData) {
      handleFormResponseNotification(actionData);

      if (actionData.status === 200) {
        navigate('/websites');
      }
    }
  }, [actionData]);

  return (
    <Page title="Edit Website">
      <Title>Edit Website</Title>
      <DataGetter<Website> url={`/api/websites/${websiteId}`}
        skeletonComponent={<FormSkeleton inputs={2} />}>
        {(website) => (
          <WebsiteForm website={website} />
        )}
      </DataGetter>
    </Page>
  );
}

export async function action(args: ActionFunctionArgs) {
  return put(`/api/websites/${args.params.websiteId}`, await prepareRequest(args));
}
