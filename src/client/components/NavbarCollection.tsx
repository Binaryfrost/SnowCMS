import { ActionIcon, Anchor, Group, Text, Tooltip } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import IconButton from './IconButton';

interface Props {
  websiteId: string
  collectionId: string
  text: string
}

export default function NavbarCollection({ websiteId, collectionId, text }: Props) {
  return (
    <Group>
      <Anchor component={Link} to={`/websites/${websiteId}/collections/${collectionId}/entries`}>
        <Tooltip label={text}>
          <Text maw={200} truncate="end">{text}</Text>
        </Tooltip>
      </Anchor>
      <IconButton label="Collection Settings" role="SUPERUSER">
        <ActionIcon component={Link}
          to={`/websites/${websiteId}/collections/${collectionId}/settings`}>
          <IconSettings />
        </ActionIcon>
      </IconButton>
    </Group>
  );
}
