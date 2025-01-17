import { type ReactNode, useEffect, useState, useRef } from 'react';
import { Text } from '@mantine/core';
import { get } from '../util/api';
import GenericSkeleton, { type GenericSkeletonProps } from './GenericSkeleton';
import { PaginatedResponse } from '../../common/types/PaginatedResponse';

interface CommonProps extends GenericSkeletonProps {
  skeletonComponent?: ReactNode
  sort?: 'asc' | 'desc'
  paginate?: boolean
  search?: string
  query?: Record<string, string>
}

interface MultipleDataGetterProps<T> extends CommonProps {
  urls: string[]
  children: ({ data, setPage }: {
    data: T,
    /** Pagination only applies to the first URL */
    setPage: (page: number) => void
  }) => ReactNode
}

interface DataGetterProps<T> extends CommonProps {
  url: string
  children: MultipleDataGetterProps<T>['children']
}

function DataGetter<T>(props: DataGetterProps<T>) {
  const { url, children, ...other } = props;
  return (
    <DataGetter.Multiple<[T]> urls={[url]} {...other}>
      {({ data, setPage }) => (
        children({
          data: data[0],
          setPage
        })
      )}
    </DataGetter.Multiple>
  );
}

interface BaseDataGetterProps<T> extends CommonProps {
  data: T
  loading: boolean
  error: boolean
  children: (data: T) => ReactNode
}

function BaseDataGetter<T>({ data, loading, error, ...props }:
  BaseDataGetterProps<T>) {
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

const stringifyParams = (params) => Object.entries(params)
  .map(([key, value]) => (value ? `${key}=${value}` : null))
  .filter(Boolean)
  .join('&');

function MultipleDataGetter<T extends any[]>(props: MultipleDataGetterProps<T>) {
  const [data, setData] = useState<T>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const searchRef = useRef(null);

  if (props.search !== searchRef.current) {
    searchRef.current = props.search;

    if (page !== 1) {
      setPage(1);
    }
  }

  const params = {
    page,
    sort: props.sort || 'asc',
    search: props.search,
    ...(props.query || {})
  };

  const stringifiedParams = stringifyParams(params);

  useEffect(() => {
    setLoading(true);
    Promise.all(props.urls.map((url, i) => get<T>(
      props.paginate && i === 0 ? `${url}?${stringifiedParams}` : url
    )))
      .then((resp) => {
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
  }, [page, props.search]);

  return (
    <BaseDataGetter<T> data={data} loading={loading} error={error} {...props}>
      {(d) => (
        props.children({
          data: d,
          setPage
        })
      )}
    </BaseDataGetter>
  );
}

interface AllPagesDataGetterProps<T> extends CommonProps {
  url: string
  children: (data: T[]) => ReactNode
  paginate?: never
}

function AllPagesDataGetter<T>(props: AllPagesDataGetterProps<T>) {
  const [data, setData] = useState<T[]>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function getPaginatedRecords(route: string, page: number): Promise<PaginatedResponse<T>> {
    const stringifiedParams = stringifyParams({
      page,
      sort: props.sort || 'asc',
      search: props.search,
      limit: 100,
      ...(props.query || {})
    });

    const resp = await get<PaginatedResponse<T>>(`${route}?${stringifiedParams}`);
    if (resp.status !== 200) {
      throw new Error(resp.body.error || 'An error occurred');
    }

    return resp.body;
  }

  async function getAllPaginatedRecords(route: string): Promise<T[]> {
    const first = await getPaginatedRecords(route, 1);
    type PagesType = PaginatedResponse<T>;
    const pages: (PagesType | Promise<PagesType>)[] = [first];

    if (first.pages > 1) {
      for (let i = 2; i <= first.pages; i++) {
        pages.push(getPaginatedRecords(route, i));
      }
    }

    return (await Promise.all(pages)).flatMap((e) => e.data);
  }

  useEffect(() => {
    getAllPaginatedRecords(props.url)
      .then((d) => setData(d))
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <BaseDataGetter<T[]> data={data} loading={loading} error={error} {...props}>
      {(d) => (
        props.children(d)
      )}
    </BaseDataGetter>
  );
}

DataGetter.Multiple = MultipleDataGetter;
DataGetter.AllPages = AllPagesDataGetter;
export default DataGetter;
