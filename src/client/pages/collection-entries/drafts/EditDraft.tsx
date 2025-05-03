import { Alert, Text, Title } from '@mantine/core';
import Page from '../../../components/Page';
import CollectionEntryForm from '../../../components/forms/CollectionEntryForm';
import { useParams } from 'react-router-dom';
import LazyLoadedCollectionSetup from '../../../components/forms/LazyLoadedCollectionSetup';

export function Component() {
  const { draftId } = useParams();

  return (
    <Page title="Drafts">
      <Title>Edit Draft</Title>

      <Alert mb="sm">
        Drafts are not visible on your website until they are published. When published,
        a new Collection Entry is created with the same data and a new creation date
        unless the draft is based on an existing entry, in which case that entry
        is updated instead.
        <Text inherit fw="bold">
          If a slug field is present below, it is recommended to update it before publishing.
        </Text>
      </Alert>

      <LazyLoadedCollectionSetup>
        <CollectionEntryForm draftId={draftId} />
      </LazyLoadedCollectionSetup>
    </Page>
  )
}
