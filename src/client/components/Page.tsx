import type { ReactNode } from 'react';

import icon from '../icon.png';

interface Props {
  title: string
  children: ReactNode
}

export default function Page({ title, children }: Props) {
  document.title = title;

  if (!document.querySelector('link[rel="icon"]')) {
    const iconElem = document.createElement('link');
    iconElem.rel = 'icon';
    iconElem.href = icon;
    document.head.appendChild(iconElem);
  }

  return children;
}
