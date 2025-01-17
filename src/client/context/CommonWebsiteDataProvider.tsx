import { type ReactNode, useState } from 'react';
import { get } from '../util/api';

export interface CommonWebsiteDataContext<T> {
  data: T
  loading: boolean,
  error: string,
  refresh: (websiteId: string, page?: number) => void
}

interface Props<T> {
  defaultData: T
  url: string
  context: React.Context<CommonWebsiteDataContext<T>>
  paginate?: boolean
  children: ReactNode
}

export default function CommonWebsiteDataProvider<T>({ defaultData, url, context, children,
  paginate }: Props<T>) {
  const [data, setData] = useState<T>(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const Context = context;

  function refresh(websiteId: string, page: number = 1) {
    if (!websiteId) {
      setData(defaultData);
      // Set loading to true so that the skeleton is visible as soon as a website is chosen
      setLoading(true);
      setError(null);
      return;
    }

    setLoading(true);
    const requestUrl = `${url.replace('{websiteId}', websiteId)}${paginate ? `?page=${page}` : ''}`;
    get<T>(requestUrl).then((resp) => {
      if (resp.status !== 200) {
        throw new Error(resp.body.error || 'An error occurred');
      }

      setData(resp.body);
    }).catch((err) => {
      setError(err.message);
    }).finally(() => {
      setLoading(false);
    });
  }

  return (
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    <Context.Provider value={{
      data,
      loading,
      error,
      refresh
    }}>
      {children}
    </Context.Provider>
  );
}
