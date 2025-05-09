import { type ReactNode } from 'react';
import { ActionIcon, type ActionIconProps, Group, Title, type TitleProps, ElementProps } from '@mantine/core';
import { NavLink } from 'react-router-dom';
import IconButton, { type IconButtonProps } from './IconButton';

interface Props {
  titleProps: TitleProps
  actionIconProps: ElementProps<'button', keyof ActionIconProps> & { children: ReactNode, [x: string]: any }
  tooltipLabel: string
  iconButtonProps?: Partial<IconButtonProps>
  link?: string
  additionalButtons?: ReactNode
}

export default function HeaderWithAddButton({ titleProps, actionIconProps,
  tooltipLabel, iconButtonProps, link, additionalButtons }: Props) {
  return (
    <Group gap="lg" mb="xs">
      <Title {...titleProps} />
      <Group gap="xs">
        <IconButton label={tooltipLabel} {...iconButtonProps}>
          {link ? (
            <ActionIcon<any> {...actionIconProps} component={NavLink} to={link} />
          ) : (
            <ActionIcon {...actionIconProps} />
          )}
        </IconButton>

        {additionalButtons}
      </Group>
    </Group>
  );
}
