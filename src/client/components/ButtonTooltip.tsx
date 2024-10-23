import { Tooltip } from '@mantine/core';
import { ReactNode } from 'react';

interface Props {
  label: string
  children: ReactNode
}

export default function ButtonTooltip({ label, children }: Props) {
  return (
    <Tooltip label={label}>
      {children}
    </Tooltip>
  );
}
