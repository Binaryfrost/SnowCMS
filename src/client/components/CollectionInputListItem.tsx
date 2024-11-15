import { ActionIcon, Box, Group, Paper, Text } from '@mantine/core';
import { IconSettings, IconTrash } from '@tabler/icons-react';
import type { CollectionInput } from '../../common/types/CollectionInputs';
import InputRegistry from '../../common/InputRegistry';
import IconButton from './IconButton';
import { Collection } from '../../common/types/Collection';
import { Website } from '../../common/types/Website';
import { showDeleteModal } from '../util/modals';
import useRefresh from '../util/refresh';
import ShortUuid from './ShortUuid';

interface Props {
  collection: Collection
  website: Website
  input: CollectionInput
  openSettings: () => void
}

export function isTemporaryInput(id: string) {
  // Only the temporary IDs are 8 characters long. UUIDs are used after the Input is saved
  return id.length === 8;
}

export function CollectionInputListItem({ collection, website, input, openSettings }: Props) {
  const refresh = useRefresh();

  const registryInput = InputRegistry.getInput(input.input);
  let inputExists = !!registryInput;
  if (inputExists &&
      'isAllowed' in registryInput &&
      !registryInput.isAllowed(website, collection)) {
    inputExists = false;
  }

  return (
    <Paper withBorder p="sm">
      <Group justify="space-between">
        <Box>
          {inputExists ? (
            <>
              <Text>{registryInput.name}: {input.name || 'Unnamed input'}</Text>
              {input.description && <Text c="dimmed">{input.description}</Text>}
              <Text c="dimmed">ID: {isTemporaryInput(input.id) ? 'Unsaved' :
              <ShortUuid uuid={input.id} />}</Text>
            </>
          ) : (
            <Text c="red">Input {input.input} no longer exists in Input Registry</Text>
          )}
        </Box>
        <Group>
          {/* TODO: Handle delete */}
          <IconButton label="Delete">
            <ActionIcon c="red" onClick={() => showDeleteModal({
              id: input.id,
              type: 'Collection Input',
              url: `/api/websites/${website.id}/collections/${collection.id}/inputs/${input.id}`,
              additional: 'This will also delete Collection Entry data for this input and unset the Collection title if it references this input.',
              onDelete: refresh
            })}>
              <IconTrash />
            </ActionIcon>
          </IconButton>

          {inputExists && (
            <IconButton label="Input Settings">
              <ActionIcon onClick={openSettings}>
                <IconSettings />
              </ActionIcon>
            </IconButton>
          )}
        </Group>
      </Group>
    </Paper>
  );
}
