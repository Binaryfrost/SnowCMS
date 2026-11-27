import { type ReactNode, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Stack, Text } from '@mantine/core';
import { CollectionsContext } from '../context/CollectionsContext';
import GenericSkeleton, { GenericSkeletonProps } from './GenericSkeleton';
import type CollectionDTO from '../../lib/client/dto/collection/CollectionDTO';
import Pagination from './Pagination';

interface Props {
  children: (collections: CollectionDTO[]) => ReactNode
  skeleton?: GenericSkeletonProps
}

export default function CollectionsGetter({ children, skeleton }: Props) {
  const collectionContext = useContext(CollectionsContext);
  const { websiteId } = useParams();

  if (collectionContext.loading) {
    return (
      <GenericSkeleton {...skeleton} />
    );
  }

  if (collectionContext.error) {
    return <Text c="red">{collectionContext.error}</Text>;
  }

  const { collections, _metadata } = collectionContext.data;

  return _metadata.page === 1 && collections.length === 0 ? (
    <Text>No Collections exist yet</Text>
  ) : (
    <Stack>
      {children(collections)}

      <Pagination page={_metadata.page} pages={_metadata.pages}
        setPage={(p) => collectionContext.refresh(websiteId, p)} />
    </Stack>
  );
}
