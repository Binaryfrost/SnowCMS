import { ActionIcon, Box, Group, Paper, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import ShortUuid, { shortenUuid } from '../components/ShortUuid';
import { del } from './api';
import InputRegistry, { Input } from '../../common/InputRegistry';
import IconButton from '../components/IconButton';
import type { Website } from '../../common/types/Website';
import type { Collection } from '../../common/types/Collection';

interface DeleteModalOpts {
  url: string
  id: string
  type: string
  onDelete: () => void
}

export function showDeleteModal(opts: DeleteModalOpts) {
  modals.openConfirmModal({
    title: `Delete ${opts.type}`,
    children: (
      <>
        <Text>Are you sure you want to delete {opts.type} with ID&nbsp;
          <ShortUuid uuid={opts.id} />?</Text>
        <Text c="dimmed">This action is irreversible.</Text>
      </>
    ),
    cancelProps: {
      children: 'Cancel'
    },
    confirmProps: {
      color: 'red',
      children: 'Delete'
    },
    onConfirm: () => {
      del(opts.url).then((resp) => {
        if (resp.status !== 200) {
          throw new Error(resp.body.error);
        }

        notifications.show({
          message: `Deleted ${opts.type} with ID ${shortenUuid(opts.id)}`
        });
        opts.onDelete();
      }).catch((err) => {
        notifications.show({
          message: `Failed to delete ${opts.type} with ID ${shortenUuid(opts.id)}: ${err.message || 'An error occurred'}`,
          color: 'red'
        });
      });
    }
  });
}

interface AddInputModalOpts {
  website: Website
  collection: Collection
  addInput: (input: Input<any>) => void
}

export function showAddInputModal(opts: AddInputModalOpts) {
  const inputs = InputRegistry.getAllInputs();

  modals.open({
    title: 'Add Collection Input',
    children: (
      <Stack>
        {Object.values(inputs)
          .filter((input) => {
            if (!('isAllowed' in input)) return true;
            return input.isAllowed(opts.website, opts.collection);
          }).map((input) => (
            <Paper withBorder py="xs" px="sm" key={input.id}>
              <Group justify="space-between">
                <Box maw="80%">
                  <Text truncate="end">{input.name}</Text>
                  <Text c="dimmed" truncate="end">ID: {input.id}</Text>
                  {input.description && <Text c="dimmed">{input.description}</Text>}
                </Box>
                <IconButton label="Add Collection Input">
                  <ActionIcon onClick={() => opts.addInput(input)}>
                    <IconPlus />
                  </ActionIcon>
                </IconButton>
              </Group>
            </Paper>
          ))}
      </Stack>
    )
  });
}
