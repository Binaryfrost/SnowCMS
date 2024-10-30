import { type ReactNode, useEffect, useState } from 'react';
import { Text } from '@mantine/core';
import { get } from '../util/api';
import GenericSkeleton, { type GenericSkeletonProps } from './GenericSkeleton';

interface CommonProps extends GenericSkeletonProps {
  skeletonComponent?: ReactNode
}

interface DataGetterProps<T> extends CommonProps {
  url: string
  children: (data: T) => ReactNode
}

function DataGetter<T>(props: DataGetterProps<T>) {
  const { url, children, ...other } = props;
  return (
    <DataGetter.Multiple<[T]> urls={[url]} {...other}>
      {(data) => (
        children(data[0])
      )}
    </DataGetter.Multiple>
  );
}

interface MultipleDataGetterProps<T> extends GenericSkeletonProps {
  urls: string[]
  skeletonComponent?: ReactNode
  children: (data: T) => ReactNode
}

function MultipleDataGetter<T extends any[]>(props: MultipleDataGetterProps<T>) {
  const [data, setData] = useState<T>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all(props.urls.map((url) => get<T>(url))).then((resp) => {
      if (resp.some((r) => r.status !== 200)) {
        throw new Error(resp.filter((r) => r.status !== 200)[0].body.error);
      }

      // @ts-ignore
      setData(resp.map((r) => r.body));
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

DataGetter.Multiple = MultipleDataGetter;
export default DataGetter;
