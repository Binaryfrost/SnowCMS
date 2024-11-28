import { useContext, useState } from 'react';
import { Box, LoadingOverlay, Modal, Paper, Stack, Text } from '@mantine/core';
import { UseListStateHandlers } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { DragDropContext, Draggable, DropResult, Droppable } from '@hello-pangea/dnd';
import HeaderWithAddButton from '../HeaderWithAddButton';
import { ADD_INPUT_MODAL_ID, showAddInputModal } from '../../util/modals';
import { WebsiteContext } from '../../context/WebsiteContext';
import type { Collection } from '../../../common/types/Collection';
import type { CollectionInput } from '../../../common/types/CollectionInputs';
import { CollectionInputListItem, isTemporaryInput } from '../CollectionInputListItem';
import { randomHex } from '../../../common/util';
import { getById } from '../../util/data';
import CollectionInputSettingsForm from './CollectionInputSettingsForm';
import { patch, post, put } from '../../util/api';
import { handleFormResponseNotification } from '../../util/form';

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
  const apiRoot = `/api/websites/${websiteContext.data.id}/collections/${collection.id}/inputs`;

  function inputWithFieldNameExists(input: CollectionInput) {
    return inputs
      .filter((i) => i.fieldName === input.fieldName)
      .filter((i) => i.id !== input.id)
      .length !== 0;
  }

  function closeSettingsModal() {
    if (isTemporaryInput(settingsModal)) {
      inputsHandlers.filter((input) => input.id !== settingsModal);
    }

    setSettingsModal(null);
  }

  function updateInput(id: string) {
    return async (cb: Parameters<UseListStateHandlers<CollectionInput>['applyWhere']>[1]) => {
      setSaving(true);

      const cbData = cb(getById<CollectionInput>(inputs, id));
      if (inputWithFieldNameExists(cbData)) {
        notifications.show({
          message: `Input with field name ${cbData.fieldName} already exists`,
          color: 'red'
        });
        setSaving(false);
        return;
      }

      inputsHandlers.applyWhere(
        (item) => item.id === id,
        cb
      );

      if (isTemporaryInput(id)) {
        const resp = await post(apiRoot, cbData);
        handleFormResponseNotification(resp);

        if (resp.status === 200) {
          inputsHandlers.applyWhere(
            (item) => item.id === id,
            (item) => ({
              ...item,
              id: resp.body.id,
            })
          );

          closeSettingsModal();
        }
      } else {
        const resp = await put(`${apiRoot}/${id}`, cbData);
        handleFormResponseNotification(resp);

        if (resp.status === 200) {
          closeSettingsModal();
        }
      }

      setSaving(false);
    };
  }

  async function reorder({ destination, source, draggableId }: DropResult) {
    if (destination === null) return;
    if (source.index === destination.index) return;
    inputsHandlers.reorder({
      from: source.index,
      to: destination.index
    });

    setSaving(true);
    const resp = await patch(`${apiRoot}/${draggableId}/order`, {
      order: destination.index
    });
    handleFormResponseNotification(resp);
    setSaving(false);
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
        {inputs.length === 0 ? (
          <Text c="dimmed">This Collection does not have any Inputs yet</Text>
        ) : (
          <DragDropContext onDragEnd={reorder}>
            <Droppable droppableId={collection.id}>
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  <Stack gap="sm">
                    {inputs.map((input, i) => (
                      <Draggable isDragDisabled={saving} key={input.id}
                        draggableId={input.id} index={i}>
                        {/* eslint-disable-next-line no-shadow */}
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}
                            {...provided.dragHandleProps}>
                            <CollectionInputListItem key={input.id} input={input}
                              collection={collection} website={websiteContext.data}
                              openSettings={() => setSettingsModal(input.id)} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Stack>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

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
