import { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
  hidden?: boolean
}

export default function Hidden({ hidden = false, children }: Props) {
  if (hidden) return null;
  return children;
}