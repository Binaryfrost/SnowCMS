import { type ReactNode, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Stack, Text } from '@mantine/core';
import { CollectionsContext } from '../context/CollectionsContext';
import GenericSkeleton, { GenericSkeletonProps } from './GenericSkeleton';
import type { Collection } from '../../common/types/Collection';
import Pagination from './Pagination';

interface Props {
  children: (collections: Collection[]) => ReactNode
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

  const { data, page, pages } = collectionContext.data;

  return page === 1 && data.length === 0 ? (
    <Text>No Collections exist yet</Text>
  ) : (
    <Stack>
      {children(data)}

      <Pagination page={page} pages={pages}
        setPage={(p) => collectionContext.refresh(websiteId, p)} />
    </Stack>
  );
}
