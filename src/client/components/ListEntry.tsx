import { ActionIcon, Box, Group, Paper, Text } from '@mantine/core';
import { IconArrowRight, IconSettings } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import ShortUuid from './ShortUuid';
import IconButton from './IconButton';
import type { Role } from '../../common/types/User';
import DeleteButton from './DeleteButton';

interface Props {
  name: string
  id: string
  type: string
  additional?: string
  buttons: {
    delete: {
      modal: {
        url: string
        refresh: () => void
      }
      role: Role
      keepTypeCase?: boolean
    }
    settings?: {
      url: string
      role: Role
    }
    enter?: {
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
          {props.additional && <Text c="dimmed">{props.additional}</Text>}
        </Box>
        <Group>
          <DeleteButton type={props.type} role={props.buttons.delete.role} id={props.id}
            url={props.buttons.delete.modal.url} onDelete={props.buttons.delete.modal.refresh}
            keepTypeCase={props.buttons.delete.keepTypeCase} />
          {props.buttons.settings && (
            <IconButton label={`${props.type} Settings`} role={props.buttons.settings.role}>
              <ActionIcon component={Link} to={props.buttons.settings.url}>
                <IconSettings />
              </ActionIcon>
            </IconButton>
          )}
          {props.buttons.enter && (
            <IconButton label={`Select ${props.type}`}>
              <ActionIcon component={Link} to={props.buttons.enter.url}>
                <IconArrowRight />
              </ActionIcon>
            </IconButton>
          )}
        </Group>
      </Group>
    </Paper>
  );
}
