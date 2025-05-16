import { useEffect, useState } from 'react';
import { ActionFunctionArgs, Form, useActionData, useNavigate } from 'react-router-dom';
import { Anchor, Box, Button, Divider, Flex, Group, Loader, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { UseFormReturnType, useForm } from '@mantine/form';
import { nprogress } from '@mantine/nprogress';
import { ModalsProvider, openModal } from '@mantine/modals';
import Logo from '../components/Logo';
import Page from '../components/Page';
import DataGetter from '../components/DataGetter';
import { LoginConfig } from '../../common/types/User';
import FormSkeleton from '../components/FormSkeleton';
import { formDataToObject, onSubmit } from '../util/form';
import { HttpResponse, post } from '../util/api';
import DarkModeToggle from '../components/DarkModeToggle';
import Hidden from '../components/Hidden';

interface LoginFormProps {
  config: LoginConfig
  form: UseFormReturnType<{
    email: string
    password: string
  }>
  submitting: boolean
}

function ssoRedirect() {
  location.href = '/api/login/sso';
}

function LoginForm({ config, form, submitting } : LoginFormProps) {
  useEffect(() => {
    if (config.sso?.forced) {
      ssoRedirect();
    }
  }, []);

  return config.sso?.forced ? (
    <Text>Redirecting to SSO login page...</Text>
  ) : (
    <>
      <TextInput label="Email" type="email" name="email" required {...form.getInputProps('email')}
        key={form.key('email')} />

      <Box>
        <PasswordInput label="Password" name="password" required {...form.getInputProps('password')}
          key={form.key('password')} />

        <Anchor component="span" fz="xs" style={{
          userSelect: 'none'
        }} onClick={() => openModal({
          title: 'Forgot password',
          children: 'If you have forgotten your password, contact the administrator of this SnowCMS instance.',
          centered: true
        })}>Forgot password</Anchor>
      </Box>

      <Group>
        <Button type="submit" loading={submitting} style={{
          flexGrow: 1
        }}>Log in</Button>
        <DarkModeToggle />
      </Group>

      {config.sso.enabled && (
        <>
          <Divider label="or" />
          <Button color="violet" loading={submitting} onClick={ssoRedirect}>Log in with SSO</Button>
        </>
      )}
    </>
  );
}

export function Component() {
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const actionData = useActionData() as HttpResponse;
  const navigate = useNavigate();
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
      password: ''
    },
    validate: {
      email: (value) => {
        if (!value) {
          return 'Email is required';
        }

        if (!value.includes('@')) {
          return 'Invalid email';
        }

        return null;
      },
      password: (value) => (!value ? 'Password is required' : null),
    },
    validateInputOnChange: true,
    onValuesChange: () => setError(null)
  });

  const ssoToken = location.hash.replace(/^#/, '');

  function redirectAfterLogin() {
    const url = localStorage.getItem('redirect') || '/';
    localStorage.removeItem('redirect');
    navigate(url);
  }

  useEffect(() => {
    nprogress.complete();

    if (ssoToken) {
      post('/api/login/sso/token', { ssoToken }, { noRedirectOn401: true }).then((resp) => {
        if (resp.status !== 200) {
          setError(resp.body.error || 'An error occurred');
          return;
        }

        localStorage.setItem('token', resp.body.token);
        redirectAfterLogin();
      });
    } else if (localStorage.getItem('token')) {
      redirectAfterLogin();
    }
  }, []);

  useEffect(() => {
    if (actionData) {
      setSubmitting(false);

      if (actionData.status !== 200) {
        setError(actionData.body.error || 'An error occurred');
      } else {
        localStorage.setItem('token', actionData.body.token);
        redirectAfterLogin();
      }
    }
  }, [actionData]);

  return (
    <Page title="Login">
      <ModalsProvider>
        <Flex justify="center" align="center" h="100dvh">
          <Paper withBorder p="md" miw="25vw" w="fit-content">
            <Form method="POST" onSubmit={(e) => {
              onSubmit(e, form);
              if (!e.isDefaultPrevented()) {
                setSubmitting(true);
              }
            }}>
              <Stack>
                <Logo noLink mx="auto" />
                <Title ta="center">Login</Title>

                {error && (
                  <Stack>
                    <Text ta="center" c="red">{error}</Text>
                    {ssoToken && (
                      <Button component="a" href="/login">Retry</Button>
                    )}
                  </Stack>
                )}

                {ssoToken ? (
                  <Hidden hidden={error}>
                    <Group justify="center">
                      <Loader />
                      <Text size="lg">Logging you in...</Text>
                    </Group>
                  </Hidden>
                ) : (
                  <DataGetter<LoginConfig> url="/api/login/config"
                    skeletonComponent={<FormSkeleton inputs={2} />}>
                    {(config) => (
                      <LoginForm config={config.data} form={form} submitting={submitting} />
                    )}
                  </DataGetter>
                )}
              </Stack>
            </Form>
          </Paper>
        </Flex>
      </ModalsProvider>
    </Page>
  );
}

export async function action({ request }: ActionFunctionArgs) {
  return post('/api/login', await formDataToObject(request), {
    noRedirectOn401: true
  });
}
