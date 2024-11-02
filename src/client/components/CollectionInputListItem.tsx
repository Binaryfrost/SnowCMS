import { ActionIcon, Box, Group, Paper, Text } from '@mantine/core';
import { IconSettings, IconTrash } from '@tabler/icons-react';
import type { CollectionInput } from '../../common/types/CollectionInputs';
import InputRegistry from '../../common/InputRegistry';
import IconButton from './IconButton';

interface Props {
  input: CollectionInput
  openSettings: () => void
}

export function isTemporaryInput(id: string) {
  // Only the temporary IDs are 8 characters long. UUIDs are used after the Input is saved
  return id.length === 8;
}

export function CollectionInputListItem({ input, openSettings }: Props) {
  const registryInput = InputRegistry.getInput(input.input);

  return (
    <Paper withBorder p="sm">
      {registryInput ? (
        <Group justify="space-between">
          <Box>
            <Text>{registryInput.name}: {input.name || 'Unnamed input'}</Text>
            {input.description && <Text c="dimmed">{input.description}</Text>}
            <Text c="dimmed">ID: {isTemporaryInput(input.id) ? 'Unsaved' : input.id}</Text>
          </Box>
          <Group>
            <IconButton label="Delete">
              <ActionIcon c="red">
                <IconTrash />
              </ActionIcon>
            </IconButton>

            <IconButton label="Input Settings">
              <ActionIcon onClick={openSettings}>
                <IconSettings />
              </ActionIcon>
            </IconButton>
          </Group>
        </Group>
      ) : (
        <Text c="red">Input {input.input} no longer exists in Input Registry</Text>
      )}
    </Paper>
  );
}
