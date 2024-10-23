import { ActionIcon, type ActionIconProps, Group, Title, type TitleProps } from '@mantine/core';
import ButtonTooltip from './ButtonTooltip';

interface Props {
  titleProps: TitleProps
  actionIconProps: ActionIconProps
  tooltipLabel: string
}

export default function HeaderWithAddButton({ titleProps, actionIconProps, tooltipLabel }: Props) {
  return (
    <Group gap="lg">
      <Title {...titleProps} />
      <ButtonTooltip label={tooltipLabel}>
        <ActionIcon {...actionIconProps} />
      </ButtonTooltip>
    </Group>
  );
}
