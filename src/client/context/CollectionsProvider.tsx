import { type ReactNode } from 'react';
import type CollectionDTO from '../../lib/client/dto/collection/CollectionDTO';
import { CollectionsContext } from './CollectionsContext';
import CommonWebsiteDataProvider from './CommonWebsiteDataProvider';
import type { PaginatedResponse } from '../../lib/client/types/PaginatedResponse';

interface Props {
  children: ReactNode
}

export default function CollectionsProvider({ children }: Props) {
  return (
    <CommonWebsiteDataProvider<PaginatedResponse<CollectionDTO>> defaultData={null}
      url="/api/websites/{websiteId}/collections" context={CollectionsContext} paginate>
      {children}
    </CommonWebsiteDataProvider>
  );
}
