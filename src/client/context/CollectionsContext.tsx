import { createContext } from 'react';
import type { Collection } from '../../common/types/Collection';

export const CollectionContext = createContext<{
  collections: Collection[],
  loading: boolean,
  error: string,
  refresh(websiteId: string): void
  // Go home Eslint, you're drunk
  // eslint-disable-next-line indent
}>(null);
