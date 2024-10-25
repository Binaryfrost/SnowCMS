import { type ReactNode, useEffect, useState } from 'react';
import { Text } from '@mantine/core';
import { get } from '../util/api';
import GenericSkeleton, { type GenericSkeletonProps } from './GenericSkeleton';

interface Props<T> extends GenericSkeletonProps {
  url: string
  skeletonComponent?: ReactNode
  children: (data: T) => ReactNode
}

export default function DataGetter<T>(props: Props<T>) {
  const [data, setData] = useState<T>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    get<T>(props.url).then((w) => {
      if (w.status !== 200) {
        throw new Error(w.body.error);
      }

      setData(w.body);
    }).catch((err) => {
      setError(err.message || 'An error occurred');
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  // eslint-disable-next-line no-nested-ternary
  return error ? <Text c="red">{error}</Text> : (
    loading ? (
      props.skeletonComponent || (
        <GenericSkeleton skeletonProps={props.skeletonProps} skeletonNum={props.skeletonNum} />
      )
    ) : (
      props.children(data)
    )
  );
}
