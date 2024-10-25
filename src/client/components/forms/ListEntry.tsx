import { ActionIcon, Box, Group, Paper, Text } from '@mantine/core';
import { IconArrowRight, IconSettings, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import ShortUuid from '../ShortUuid';
import IconButton from '../IconButton';
import { showDeleteModal } from '../../util/modals';
import type { Role } from '../../../common/types/User';

interface Props {
  name: string
  id: string
  type: string
  buttons: {
    delete: {
      modal: {
        url: string
        refresh: () => void
      }
      role: Role
    }
    settings: {
      url: string
      role: Role
    }
    enter: {
      url: string
    }
  }
}

export default function ListEntry(props: Props) {
  return (
    <Paper py="md" px="xl" withBorder>
      <Group justify="space-between">
        <Box>
          <Text fw="bold" fz="lg">{props.name}</Text>
          <Text c="dimmed">ID: <ShortUuid uuid={props.id} /></Text>
        </Box>
        <Group>
          <IconButton label={`Delete ${props.type}`} role={props.buttons.delete.role}>
            <ActionIcon color="red" onClick={() => showDeleteModal({
              id: props.id,
              url: props.buttons.delete.modal.url,
              type: props.type.toLowerCase(),
              onDelete: props.buttons.delete.modal.refresh
            })}>
              <IconTrash />
            </ActionIcon>
          </IconButton>
          <IconButton label={`${props.type} Settings`} role={props.buttons.settings.role}>
            <ActionIcon component={Link} to={props.buttons.settings.url}>
              <IconSettings />
            </ActionIcon>
          </IconButton>
          <IconButton label={`Select ${props.type}`}>
            <ActionIcon component={Link} to={props.buttons.enter.url}>
              <IconArrowRight />
            </ActionIcon>
          </IconButton>
        </Group>
      </Group>
    </Paper>
  );
}
