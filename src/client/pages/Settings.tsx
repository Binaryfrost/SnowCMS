import { Title } from '@mantine/core';
import Page from '../components/Page';

/*
 * TODO: Add API key generator with a few different validity lengths. The generator should allow
 * admins to select the website that the API key should be valid for, and they should be able
 * to set an API key role up to (excluding) ADMIN, for security reasons.
 *
 * Have security notice about JWTs not being revocable without changing secret in config file
 */
export function Component() {
  return (
    <Page title="Settings">
      <Title>Settings</Title>
    </Page>
  );
}
