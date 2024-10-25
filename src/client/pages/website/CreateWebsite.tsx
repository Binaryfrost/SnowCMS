import { Title } from '@mantine/core';
import { useActionData, useNavigate, type ActionFunctionArgs } from 'react-router-dom';
import { useEffect } from 'react';
import Page from '../../components/Page';
import WebsiteForm, { prepareRequest } from '../../components/forms/WebsiteForm';
import { type HttpResponse, post } from '../../util/api';
import { handleFormResponseNotification } from '../../util/form';

export function Component() {
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
    <Page title="Create Website">
      <Title>Create Website</Title>
      <WebsiteForm />
    </Page>
  );
}

export async function action(args: ActionFunctionArgs) {
  return post('/api/websites', await prepareRequest(args));
}
