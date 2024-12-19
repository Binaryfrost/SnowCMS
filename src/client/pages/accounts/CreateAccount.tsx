import { useEffect } from 'react';
import { useActionData, useNavigate, type ActionFunctionArgs } from 'react-router-dom';
import { Title } from '@mantine/core';
import Page from '../../components/Page';
import AccountForm, { prepareRequest } from '../../components/forms/AccountForm';
import { HttpResponse, post } from '../../util/api';
import { handleFormResponseNotification } from '../../util/form';

export function Component() {
  const navigate = useNavigate();
  const actionData = useActionData() as HttpResponse;

  useEffect(() => {
    if (actionData) {
      handleFormResponseNotification(actionData);

      if (actionData.status === 200) {
        navigate('/accounts');
      }
    }
  }, [actionData]);

  return (
    <Page title="Create Account">
      <Title>Create Account</Title>
      <AccountForm />
    </Page>
  );
}

export async function action(args: ActionFunctionArgs) {
  return post('/api/accounts', await prepareRequest(args));
}
