import { createContext } from 'react';
import type { Website } from '../../common/types/Website';
import { type CommonWebsiteDataContext } from './CommonWebsiteDataProvider';

export const WebsiteContext = createContext<CommonWebsiteDataContext<Website>>(null);
