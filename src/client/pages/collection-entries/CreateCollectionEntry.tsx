import { Title } from '@mantine/core';
import Page from '../../components/Page';
import LazyLoadedCollectionSetup from '../../components/forms/LazyLoadedCollectionSetup';
import CollectionEntryForm from '../../components/forms/CollectionEntryForm';

export function Component() {
  return (
    <Page title="Create Collection Entry">
      <Title>Create Collection Entry</Title>
      <LazyLoadedCollectionSetup>
        <CollectionEntryForm />
      </LazyLoadedCollectionSetup>
    </Page>
  );
}
