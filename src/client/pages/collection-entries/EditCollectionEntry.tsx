import { useParams } from 'react-router-dom';
import { Title } from '@mantine/core';
import Page from '../../components/Page';
import LazyLoadedCollectionEntryForm from '../../components/forms/LazyLoadedCollectionEntryForm';

export function Component() {
  const { entryId } = useParams();

  return (
    <Page title="Edit Collection Entry">
      <Title>Edit Collection Entry</Title>
      <LazyLoadedCollectionEntryForm entryId={entryId} />
    </Page>
  );
}
