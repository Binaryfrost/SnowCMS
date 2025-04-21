import { useState } from 'react';
import CollectionEntryForm from './CollectionEntryForm';
import { LoadingOverlay } from '@mantine/core';

export default function LazyLoadedCollectionEntryForm(
  props: Parameters<typeof CollectionEntryForm>[0]
) {
  const [loading, setLoading] = useState(true);

  import('../../../common/setup').then(({ default: setup }) => {
    setup();
    setLoading(false);
  });

  return loading ? (
    <LoadingOverlay visible />
  ) : (
    <CollectionEntryForm {...props} />
  )
}