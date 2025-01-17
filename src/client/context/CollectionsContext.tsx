import { createContext } from 'react';
import type { Collection } from '../../common/types/Collection';
import { CommonWebsiteDataContext } from './CommonWebsiteDataProvider';
import { PaginatedResponse } from '../../common/types/PaginatedResponse';

type CollectionsContextType = CommonWebsiteDataContext<PaginatedResponse<Collection>>;
export const CollectionsContext = createContext<CollectionsContextType>(null);
