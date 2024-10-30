import { Box, type BoxProps } from '@mantine/core';
import { type ReactNode } from 'react';

interface Props {
  props?: BoxProps
  children: ReactNode
}

export default function FlexGrow({ props, children }: Props) {
  const { style, ...p } = props || {};

  return (
    <Box {...p} style={{
      flexGrow: 1,
      ...style
    }}>
      {children}
    </Box>
  );
}
