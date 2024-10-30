import { type ReactNode } from 'react';
import type { Collection } from '../../common/types/Collection';
import { CollectionsContext } from './CollectionsContext';
import CommonWebsiteDataProvider from './CommonWebsiteDataProvider';

interface Props {
  children: ReactNode
}

export default function CollectionsProvider({ children }: Props) {
  return (
    <CommonWebsiteDataProvider<Collection[]> defaultData={null}
      url="/api/websites/{websiteId}/collections" context={CollectionsContext}>
      {children}
    </CommonWebsiteDataProvider>
  );
}
