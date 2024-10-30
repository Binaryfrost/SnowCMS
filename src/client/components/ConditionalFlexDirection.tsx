import { Group, GroupProps, Stack, StackProps } from '@mantine/core';
import { type ReactNode } from 'react';

interface Props {
  group: () => boolean
  props?: GroupProps & StackProps
  groupProps?: GroupProps
  stackProps?: StackProps
  children: ReactNode
}

export default function ConditionalFlexDirection(props: Props) {
  return props.group() ? (
    <Group {...props.props} {...props.groupProps}>
      {props.children}
    </Group>
  ) : (
    <Stack {...props.props} {...props.stackProps}>
      {props.children}
    </Stack>
  );
}
