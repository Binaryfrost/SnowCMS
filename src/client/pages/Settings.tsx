import { Title } from '@mantine/core';
import Page from '../components/Page';

/*
 * TODO: Add API key generator with a few different validity lengths
 * Have security notice about JWTs not being revocable without
 * changing secret in config file
 */
export function Component() {
  return (
    <Page title="Settings">
      <Title>Settings</Title>
    </Page>
  );
}
