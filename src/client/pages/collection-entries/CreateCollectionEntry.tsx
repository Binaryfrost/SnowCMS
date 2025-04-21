import { Title } from '@mantine/core';
import Page from '../../components/Page';
import LazyLoadedCollectionEntryForm from '../../components/forms/LazyLoadedCollectionEntryForm';

export function Component() {
  return (
    <Page title="Create Collection Entry">
      <Title>Create Collection Entry</Title>
      <LazyLoadedCollectionEntryForm />
    </Page>
  );
}
