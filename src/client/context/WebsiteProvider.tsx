import { type ReactNode } from 'react';
import { Website } from '../../common/types/Website';
import { WebsiteContext } from './WebsiteContext';
import CommonWebsiteDataProvider from './CommonWebsiteDataProvider';

interface Props {
  children: ReactNode
}

export default function WebsiteProvider({ children }: Props) {
  return (
    <CommonWebsiteDataProvider<Website> defaultData={null} url="/api/websites/{websiteId}"
      context={WebsiteContext}>
      {children}
    </CommonWebsiteDataProvider>
  );
}
