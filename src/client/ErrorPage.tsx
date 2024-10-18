import { Link, useRouteError } from 'react-router-dom';
import { Anchor, Center, Group, Stack, Text, Title } from '@mantine/core';
import { useEffect } from 'react';
import { nprogress } from '@mantine/nprogress';

export default function ErrorPage() {
  const error = useRouteError();

  useEffect(() => {
    nprogress.complete();
  }, []);

  return (
    <Center h="100vh">
      <Stack gap="xs">
        <Title size="h3" ta="center">An error occurred</Title>
        {/* @ts-ignore */}
        <Text ta="center" c="dimmed">{error.statusText || error.message}</Text>
        <Group justify="center">
          <Anchor component={Link} to={location.pathname} reloadDocument>Reload</Anchor>
          <Anchor component={Link} to="/" onClick={() => nprogress.start()}>Home</Anchor>
        </Group>
      </Stack>
    </Center>
  );
}
