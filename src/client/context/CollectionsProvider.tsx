import { type ReactNode, useState } from 'react';
import type { Collection } from '../../common/types/Collection';
import { CollectionContext } from './CollectionsContext';
import { get } from '../util/api';

interface Props {
  children: ReactNode
}

export default function CollectionsProvider({ children }: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function refresh(websiteId: string) {
    if (!websiteId) {
      setCollections([]);
      // Set loading to true so that the skeleton is visible as soon as a website is chosen
      setLoading(true);
      setError(null);
      return;
    }

    setLoading(true);
    get<Collection[]>(`/api/websites/${websiteId}/collections`).then((resp) => {
      if (resp.status !== 200) {
        throw new Error(resp.body.error || 'An error occurred');
      }

      setCollections(resp.body);
    }).catch((err) => {
      setError(err.message);
    }).finally(() => {
      setLoading(false);
    });
  }

  return (
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    <CollectionContext.Provider value={{
      collections,
      loading,
      error,
      refresh
    }}>
      {children}
    </CollectionContext.Provider>
  );
}
