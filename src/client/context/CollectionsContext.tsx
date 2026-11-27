import { createContext } from 'react';
import type CollectionDTO from '../../lib/client/dto/collection/CollectionDTO';
import { CommonWebsiteDataContext } from './CommonWebsiteDataProvider';
import type { PaginatedResponse } from '../../lib/client/types/PaginatedResponse';

type CollectionsContextType = CommonWebsiteDataContext<PaginatedResponse<CollectionDTO>>;
export const CollectionsContext = createContext<CollectionsContextType>(null);
