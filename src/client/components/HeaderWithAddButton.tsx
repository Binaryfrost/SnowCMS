import { ActionIcon, type ActionIconProps, Group, Title, type TitleProps } from '@mantine/core';
import { NavLink } from 'react-router-dom';
import IconButton, { type IconButtonProps } from './IconButton';

interface Props {
  titleProps: TitleProps
  actionIconProps: ActionIconProps
  tooltipLabel: string
  iconButtonProps?: Partial<IconButtonProps>
  link?: string
}

export default function HeaderWithAddButton({ titleProps, actionIconProps,
  tooltipLabel, iconButtonProps, link }: Props) {
  return (
    <Group gap="lg" mb="xs">
      <Title {...titleProps} />
      <IconButton label={tooltipLabel} {...iconButtonProps}>
        {link ? (
          <ActionIcon {...actionIconProps} component={NavLink} to={link} />
        ) : (
          <ActionIcon {...actionIconProps} />
        )}
      </IconButton>
    </Group>
  );
}
