import { useContext } from 'react';
import { ActionIcon, Anchor, Group, Text, Tooltip } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import IconButton from './IconButton';
import DeleteButton from './DeleteButton';
import { CollectionsContext } from '../context/CollectionsContext';

interface Props {
  websiteId: string
  collectionId: string
  text: string
}

export default function NavbarCollection({ websiteId, collectionId, text }: Props) {
  const collectionContext = useContext(CollectionsContext);

  return (
    <Group justify="space-between">
      <Anchor component={Link} to={`/websites/${websiteId}/collections/${collectionId}/entries`}>
        <Tooltip label={text}>
          <Text maw={200} truncate="end">{text}</Text>
        </Tooltip>
      </Anchor>
      <Group gap="sm">
        <IconButton label="Collection Settings" role="SUPERUSER">
          <ActionIcon component={Link}
            to={`/websites/${websiteId}/collections/${collectionId}/settings`}>
            <IconSettings />
          </ActionIcon>
        </IconButton>
        <DeleteButton type="Collection" role="SUPERUSER" id={collectionId}
          url={`/api/websites/${websiteId}/collections/${collectionId}`}
          onDelete={() => collectionContext.refresh(websiteId)} keepTypeCase />
      </Group>
    </Group>
  );
}
