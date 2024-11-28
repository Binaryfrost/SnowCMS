import { useState } from 'react';
import { ActionIcon, Box, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import ShortUuid, { shortenUuid } from '../components/ShortUuid';
import { del } from './api';
import InputRegistry, { Input } from '../../common/InputRegistry';
import IconButton from '../components/IconButton';
import type { Website } from '../../common/types/Website';
import type { Collection } from '../../common/types/Collection';
import SelectMedia, { SelectMediaProps } from '../components/SelectMedia';
import AddHtmlModalContent, { type AddHtmlModalContentProps } from '../components/AddHtmlModalContent';

export interface DeleteModalOpts {
  url: string
  id: string
  type: string
  additional?: string
  onDelete: () => void
}

export const DELETE_MODAL_ID = 'delete_modal';
function DeleteModal(props: DeleteModalOpts) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <Stack>
      <Box>
        <Text>Are you sure you want to delete {props.type} with ID&nbsp;
          <ShortUuid uuid={props.id} />?</Text>
        {props.additional && <Text mt="xs" mb="xs">{props.additional}</Text>}
        <Text c="dimmed">This action is irreversible.</Text>
      </Box>
      <Group justify="end">
        <Button variant="default" loading={submitting}
          onClick={() => modals.close(DELETE_MODAL_ID)}>Cancel</Button>
        <Button color="red" loading={submitting} onClick={() => {
          setSubmitting(true);
          del(props.url).then((resp) => {
            if (resp.status !== 200) {
              throw new Error(resp.body.error);
            }

            notifications.show({
              message: `Deleted ${props.type} with ID ${shortenUuid(props.id)}`
            });
            props.onDelete();
            modals.close(DELETE_MODAL_ID);
          }).catch((err) => {
            notifications.show({
              message: `Failed to delete ${props.type} with ID ${shortenUuid(props.id)}: ${err.message || 'An error occurred'}`,
              color: 'red'
            });
          }).finally(() => {
            setSubmitting(false);
          });
        }}>Delete</Button>
      </Group>
    </Stack>
  );
}

export function showDeleteModal(opts: DeleteModalOpts) {
  modals.open({
    title: `Delete ${opts.type}`,
    modalId: DELETE_MODAL_ID,
    // Don't want users to close the modal while a delete request is in progress
    closeOnEscape: false,
    closeOnClickOutside: false,
    withCloseButton: false,
    children: <DeleteModal {...opts} />
  });
}

interface AddInputModalOpts {
  website: Website
  collection: Collection
  addInput: (input: Input<any>) => void
}

export const ADD_INPUT_MODAL_ID = 'add_input_modal';
export function showAddInputModal(opts: AddInputModalOpts) {
  const inputs = InputRegistry.getAllInputs();

  modals.open({
    title: 'Add Collection Input',
    modalId: ADD_INPUT_MODAL_ID,
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

export const SELECT_MEDIA_MODAL_ID = 'select_media_modal';
export function showSelectMediaModal({ ...props }: SelectMediaProps) {
  modals.open({
    title: 'Select Media',
    size: 'xl',
    modalId: SELECT_MEDIA_MODAL_ID,
    children: <SelectMedia {...props} />
  });
}
