import { useParams } from 'react-router-dom';
import { Title } from '@mantine/core';
import Page from '../../components/Page';
import CollectionEntryForm from '../../components/forms/CollectionEntryForm';

export function Component() {
  const { entryId } = useParams();

  return (
    <Page title="Edit Collection Entry">
      <Title>Edit Collection Entry</Title>
      <CollectionEntryForm entryId={entryId} />
    </Page>
  );
}
