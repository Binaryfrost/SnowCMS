import { type ReactNode } from 'react';
import type WebsiteDTO from '../../lib/client/dto/website/WebsiteDTO';
import { WebsiteContext } from './WebsiteContext';
import CommonWebsiteDataProvider from './CommonWebsiteDataProvider';

interface Props {
  children: ReactNode
}

export default function WebsiteProvider({ children }: Props) {
  return (
    <CommonWebsiteDataProvider<WebsiteDTO> defaultData={null} url="/api/websites/{websiteId}"
      context={WebsiteContext}>
      {children}
    </CommonWebsiteDataProvider>
  );
}
