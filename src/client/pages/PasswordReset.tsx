import { Anchor, Button, Divider, Flex, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { LoginConfig } from '../../common/types/User';
import DataGetter from '../components/DataGetter';
import FormSkeleton from '../components/FormSkeleton';
import { Link } from 'react-router-dom';
import Page from '../components/Page';
import Logo from '../components/Logo';
import { useField, useForm } from '@mantine/form';
import { post } from '../util/api';
import { useState } from 'react';

function InitPasswordResetForm() {
  const [response, setResponse] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const field = useField({
    initialValue: '',
    validate: (value) => !value || !value.includes('@') ? 'Invalid email address' : null,
    validateOnChange: true
  });

  async function submit() {
    if (await field.validate()) {
      return;
    }

    setSubmitting(true);

    const resp = await post('/api/login/password-reset', {
      email: field.getValue()
    });

    if (resp.status !== 200) {
      setResponse(resp.body.error || 'An error occurred, please try again later');
      return;
    }

    setResponse(resp.body.message);
  }

  return !response ? (
    <>
      <TextInput
        type="email"
        label="Email"
        onKeyUp={(e) => {
          if (e.key === 'Enter') submit();
        }}
        {...field.getInputProps()}
        required />
      <Button onClick={submit} loading={submitting}>Request Password Reset</Button>
    </>
  ) : (
    <Text>{response}</Text>
  )
}

function ResetPasswordForm({ token }: { token? : string }) {
  const [response, setResponse] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm({
    initialValues: {
      password: '',
      confirmPassword: ''
    },
    validate: {
      password: (value) => !value ? 'Password is required' : null,
      confirmPassword: (value, values) => value != values.password ? 'Passwords must match' : null
    },
    validateInputOnChange: true
  });

  async function submit() {
    if (form.validate().hasErrors) {
      return;
    }

    setSubmitting(true);
    const resp = await post(`/api/login/password-reset/${token}`, {
      password: form.getValues().password
    });

    if (resp.status !== 200) {
      setResponse(resp.body.error || 'An error occurred, please try again later');
      return;
    }

    setResponse(resp.body.message);
  }

  function handleEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submit();
  }

  return !response ? (
    <DataGetter<LoginConfig> url={`/api/login/password-reset/${token}`}
      skeletonComponent={<FormSkeleton inputs={2} />}>
      {() => (
        <>
          <PasswordInput
            label="Password"
            onKeyUp={handleEnter}
            {...form.getInputProps('password')}
            required />
          <PasswordInput
            label="Confirm Password"
            onKeyUp={handleEnter}
            {...form.getInputProps('confirmPassword')}
            required />
          <Button onClick={submit} loading={submitting}>Reset Password</Button>
        </>
      )}
    </DataGetter>
  ) : (
    <Text>{response}</Text>
  )
}

function RenderForm({ token }: { token? : string }) {
  return token ? <ResetPasswordForm token={token} /> : <InitPasswordResetForm />;
}

function isEnabled(config: LoginConfig) {
  return config.smtp && !config.sso?.forced;
}

export function Component() {
  const resetToken = location.hash.replace(/^#/, '');

  return (
    <Page title="Reset Password">
      <Flex justify="center" align="center" h="100dvh">
        <Paper withBorder p="md" miw="25vw" w="fit-content">
          <Stack>
            <Logo noLink mx="auto" />
            <Title ta="center">Reset Password</Title>

            <DataGetter<LoginConfig> url="/api/login/config"
              skeletonComponent={<FormSkeleton inputs={1} />}>
              {({ data: config }) => (
                <>
                  {isEnabled(config) ? (
                    <Stack>
                      <RenderForm token={resetToken} />
                    </Stack>
                  ) : (
                    <Text c="red">Password resets are disabled</Text>
                  )}
                  <Divider />
                  <Anchor component={Link} to="/login">Back to login page</Anchor>
                </>
              )}
            </DataGetter>
          </Stack>
        </Paper>
      </Flex>
    </Page>
  );
}
