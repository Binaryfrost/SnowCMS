import { Title } from '@mantine/core';
import Page from '../../components/Page';
import CollectionEntryForm from '../../components/forms/CollectionEntryForm';

export function Component() {
  return (
    <Page title="Create Collection Entry">
      <Title>Create Collection Entry</Title>
      <CollectionEntryForm />
    </Page>
  );
}
