import { type ReactNode, useContext } from 'react';
import { Text } from '@mantine/core';
import { CollectionsContext } from '../context/CollectionsContext';
import GenericSkeleton, { GenericSkeletonProps } from './GenericSkeleton';
import type { Collection } from '../../common/types/Collection';

interface Props {
  children: (collections: Collection[]) => ReactNode
  skeleton?: GenericSkeletonProps
}

export default function CollectionsGetter({ children, skeleton }: Props) {
  const collectionContext = useContext(CollectionsContext);

  if (collectionContext.loading) {
    return (
      <GenericSkeleton {...skeleton} />
    );
  }

  if (collectionContext.error) {
    return <Text c="red">{collectionContext.error}</Text>;
  }

  return collectionContext.data.length === 0 ? (
    <Text>No Collections exist yet</Text>
  ) : (
    children(collectionContext.data)
  );
}
