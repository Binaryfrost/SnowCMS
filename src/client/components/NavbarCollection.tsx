import { ActionIcon, Anchor, Group, Text, Tooltip } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import ButtonTooltip from './ButtonTooltip';

interface Props {
  collectionId: string
  text: string
}

export default function NavbarCollection({ collectionId, text }: Props) {
  return (
    <Group>
      <Anchor to="#" component={Link}>
        <Tooltip label={text}>
          <Text maw={200} truncate="end">{text}</Text>
        </Tooltip>
      </Anchor>
      <ButtonTooltip label="Collection Settings">
        <ActionIcon>
          <IconSettings />
        </ActionIcon>
      </ButtonTooltip>
    </Group>
  );
}
