import { createContext } from 'react';
import type { Collection } from '../../common/types/Collection';
import { CommonWebsiteDataContext } from './CommonWebsiteDataProvider';

export const CollectionsContext = createContext<CommonWebsiteDataContext<Collection[]>>(null);
