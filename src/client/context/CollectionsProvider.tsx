import { type ReactNode } from 'react';
import type { Collection } from '../../common/types/Collection';
import { CollectionsContext } from './CollectionsContext';
import CommonWebsiteDataProvider from './CommonWebsiteDataProvider';
import { PaginatedResponse } from '../../common/types/PaginatedResponse';

interface Props {
  children: ReactNode
}

export default function CollectionsProvider({ children }: Props) {
  return (
    <CommonWebsiteDataProvider<PaginatedResponse<Collection>> defaultData={null}
      url="/api/websites/{websiteId}/collections" context={CollectionsContext} paginate>
      {children}
    </CommonWebsiteDataProvider>
  );
}
