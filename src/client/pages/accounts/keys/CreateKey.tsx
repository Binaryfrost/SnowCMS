import { type ActionFunctionArgs } from 'react-router-dom';
import { Title } from '@mantine/core';
import Page from '../../../components/Page';
import ApiKeyForm, { prepareRequest } from '../../../components/forms/ApiKeyForm';
import { post } from '../../../util/api';

export function Component() {
  return (
    <Page title="Create API Key">
      <Title>Create API Key</Title>
      <ApiKeyForm />
    </Page>
  );
}

export async function action(args: ActionFunctionArgs) {
  return post(`/api/accounts/${args.params.accountId}/keys`, await prepareRequest(args));
}
