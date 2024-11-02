import { useContext, useState } from 'react';
import { Box, LoadingOverlay, Modal, Paper, Stack, Text } from '@mantine/core';
import { UseListStateHandlers, useListState } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import HeaderWithAddButton from '../HeaderWithAddButton';
import { ADD_INPUT_MODAL_ID, showAddInputModal } from '../../util/modals';
import { WebsiteContext } from '../../context/WebsiteContext';
import type { Collection } from '../../../common/types/Collection';
import type { CollectionInput } from '../../../common/types/CollectionInputs';
import { CollectionInputListItem, isTemporaryInput } from '../CollectionInputListItem';
import { randomHex } from '../../util/random';
import { getById } from '../../util/data';
import CollectionInputSettingsForm from './CollectionInputSettingsForm';

interface Props {
  collection: Collection
  inputs: CollectionInput[]
  inputsHandlers: UseListStateHandlers<CollectionInput>
}

export default function CollectionInputsForm({ collection, inputs, inputsHandlers }: Props) {
  const websiteContext = useContext(WebsiteContext);
  const [settingsModal, setSettingsModal] = useState<string>(null);
  const settingsInput = getById<CollectionInput>(inputs, settingsModal);
  const [saving, setSaving] = useState(false);

  console.log(inputs);

  function closeSettingsModal() {
    if (isTemporaryInput(settingsModal)) {
      inputsHandlers.filter((input) => input.id !== settingsModal);
    }

    setSettingsModal(null);
  }

  function updateInput(id: string) {
    return (cb: Parameters<UseListStateHandlers<CollectionInput>['applyWhere']>[1]) => {
      setSaving(true);
      setTimeout(() => {
        // TODO: Send request to server
        inputsHandlers.applyWhere(
          (item) => item.id === id,
          cb
        );

        closeSettingsModal();
        setSaving(false);
      }, 2500);
    };
  }

  return (
    <Box>
      <HeaderWithAddButton titleProps={{
        order: 2,
        children: 'Collection Inputs'
      }} actionIconProps={{
        children: <IconPlus />,
        onClick: () => showAddInputModal({
          website: websiteContext.data,
          collection,
          addInput: (input) => {
            // TODO: Close modal and open settings and then save input in database

            // Temporary ID only used until the Input is saved
            const id = randomHex(8);

            inputsHandlers.append({
              id,
              collectionId: collection.id,
              name: '',
              description: '',
              fieldName: '',
              input: input.id,
              inputConfig: ''
            });

            modals.close(ADD_INPUT_MODAL_ID);
            setSettingsModal(id);
          }
        })
      }} tooltipLabel="Add Collection Input" />

      <Paper withBorder p="sm">
        <Stack gap="sm">
          {inputs.length === 0 && (
            <Text c="dimmed">This Collection does not have any Inputs yet</Text>
          )}

          {inputs.map((input) => (
            <CollectionInputListItem key={input.id} input={input}
              openSettings={() => setSettingsModal(input.id)} />
          ))}
        </Stack>

        <Modal opened={!!settingsInput} onClose={closeSettingsModal} title="Input Settings"
          // Don't want users closing the modal while the settings are being saved
          closeOnClickOutside={!saving} closeOnEscape={!saving} withCloseButton={!saving}>
          {settingsInput && (
            <>
              <LoadingOverlay visible={saving} />
              <CollectionInputSettingsForm collectionInput={settingsInput}
                close={closeSettingsModal} update={updateInput(settingsInput.id)} />
            </>
          )}
        </Modal>
      </Paper>
    </Box>
  );
}
