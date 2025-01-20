import { ActionFunctionArgs, useParams } from 'react-router-dom';
import { Title } from '@mantine/core';
import Page from '../../../components/Page';
import DataGetter from '../../../components/DataGetter';
import { ApiKeyWithWebsites } from '../../../../common/types/User';
import FormSkeleton from '../../../components/FormSkeleton';
import ApiKeyForm, { prepareRequest } from '../../../components/forms/ApiKeyForm';
import { put } from '../../../util/api';

export function Component() {
  const { accountId, keyId } = useParams();

  return (
    <Page title="Edit API Key">
      <Title>Edit API Key</Title>

      <DataGetter<ApiKeyWithWebsites> url={`/api/accounts/${accountId}/keys/${keyId}`}
        skeletonComponent={<FormSkeleton inputs={2} />}>
        {({ data: key }) => (
          <ApiKeyForm apiKey={key} />
        )}
      </DataGetter>
    </Page>
  );
}

export async function action(args: ActionFunctionArgs) {
  const { accountId, keyId } = args.params;
  return put(`/api/accounts/${accountId}/keys/${keyId}`, await prepareRequest(args));
}
