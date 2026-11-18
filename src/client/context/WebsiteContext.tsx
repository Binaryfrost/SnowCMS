import { createContext } from 'react';
import type WebsiteDTO from '../../lib/client/dto/website/WebsiteDTO';
import { type CommonWebsiteDataContext } from './CommonWebsiteDataProvider';

export const WebsiteContext = createContext<CommonWebsiteDataContext<WebsiteDTO>>(null);
