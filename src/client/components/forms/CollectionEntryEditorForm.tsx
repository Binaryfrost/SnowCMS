import { useContext, useRef, useState } from 'react';
import { Button, Grid, Modal, Stack, Text } from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { CollectionInput } from '../../../common/types/CollectionInputs';
import InputRegistry, {
  InputProps, RegisterValidatorFunction, type Input
} from '../../../common/InputRegistry';
import { HttpResponse, del, patch, post, put } from '../../util/api';
import { handleFormResponseNotification } from '../../util/form';
import { UserContext } from '../../context/UserContext';
import { IconCalendarMinus } from '@tabler/icons-react';
import IconButton from '../IconButton';
import { formatDate } from '../../util/data';
import { useDisclosure } from '@mantine/hooks';
import { DateTimePicker } from '@mantine/dates';
import { BlockingConfirmModalResult, showBlockingConfirmModal } from '../../util/modals';

interface Props {
  entryId?: string
  draftId?: string
  backdatingEnabled: boolean
  inputs: CollectionInput[]
  data?: {
    inputId: string
    data: string
  }[]
}

function addBackdatedTimestamp(url: string, date: Date) {
  if (!date) return url;
  return `${url}?createdAt=${Math.floor(date.getTime() / 1000)}`;
}

export default function CollectionEntryEditorForm({
  entryId, draftId, backdatingEnabled, inputs, data
}: Props) {
  const { websiteId, collectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [submitting, setSubmitting] = useState(false);
  const [values, setInputValues] = useState<Record<string, any>>(() => {
    if (!data) return {};
    return data.reduce((a, c) => ({
      ...a,
      [c.inputId]: deserialize(c.inputId, c.data)
    }), {});
  });
  const [opened, { open, close }] = useDisclosure();
  const [backdatedTime, setBackdatedTime] = useState<Date | null>(null);

  const validators = useRef<Record<string, RegisterValidatorFunction<any>>>({});

  function hasErrors() {
    return Object.entries(validators.current)
      .map(([id, fn]) => fn(values[id]))
      .some(Boolean);
  }

  function updateValue(id: string, value: any) {
    setInputValues((values) => ({
      ...values,
      [id]: value
    }));
  }

  function getInputFieldName(id: string): string {
    const fieldName = inputs.find((input) => input.id === id)?.fieldName;
    if (!fieldName) throw new Error(`Collection Input with ID ${id} does not exist`);
    return fieldName;
  }

  function getRegistryInput<T = any, S = any>(id: string): Input<T, S> {
    const registryId = inputs.find((input) => input.id === id)?.input;
    if (!registryId) throw new Error(`Collection Input with ID ${id} does not exist`);

    const input = InputRegistry.getInput(registryId);
    if (!registryId) throw new Error(`Registry Input with ID ${id} does not exist`);

    return input;
  }

  function serialize(id: string, value: any): string {
    const registryInput = getRegistryInput(id);
    if (registryInput.isVisualOnly) return null;
    return registryInput.serialize(value);
  }

  function deserialize<T = any>(id: string, value: string): T {
    const registryInput = getRegistryInput<T>(id);
    if (registryInput.isVisualOnly) return null;
    return registryInput.deserialize(value);
  }

  function getFormData(validate: boolean = true): Record<string, string> {
    if (validate && hasErrors()) {
      /*
      * On long Entries, it often isn't immediately obvious that there is an error
      * and may seem like the save button doesn't work.
      */
      notifications.show({
        message: 'Unable to save Collection Entry. One or more inputs has an error.',
        color: 'red'
      });
      return;
    }

    return Object.entries(values)
      .reduce((a, [id, value]) => ({
        ...a,
        [getInputFieldName(id)]: serialize(id, value)
      }), {})
  }

  async function save(draft: boolean = false) {
    const formData = getFormData(!draft);
    if (!formData) return;

    const baseApiRoot = `/api/websites/${websiteId}/collections/${collectionId}`;
    const draftsApiRoot = `${baseApiRoot}/drafts`;
    const entriesApiRoot = `${baseApiRoot}/entries`;

    /**
     * If draft is true and there is not a draftId, create a new draft.
     * If draft is true and there is not a draftId but an entryId is present, create a new draft passing the entry ID as a parameter.
     * If draft is true and there is a draftId, update that draft.
     * If draft is false and there is a draftId but no entryId, create a new entry and then delete the draft.
     * If draft is false and there is an entryId and a draftId, update that entry and then delete the draft.
     * If draft is false and there is not an entryId nor a draftId, create a new entry.
     * If draft is false and there is an entryId but no draftId, update that entry.
     */

    if (draftId && !draft) {
      const confirmResult = await showBlockingConfirmModal({
        title: 'Publish draft',
        labels: {
          confirm: 'Publish',
          cancel: 'Cancel'
        },
        children: 'Are you sure you want to publish this draft? Once published, the Collection Entry will stay published - you can still edit it or create new drafts, but it can\'t be reverted back to a draft without creating a new one and deleting the published Collection Entry.'
      });

      if (confirmResult !== BlockingConfirmModalResult.CONFIRM) {
        return;
      }
    }

    let resp: HttpResponse;
    setSubmitting(true);

    // Save as draft
    if (draft) {
      // New non-draft entry
      if (!draftId) {
        const url = entryId ? `${draftsApiRoot}?entry=${entryId}` : draftsApiRoot;
        resp = await post(url, formData);
      // Draft entry
      } else {
        resp = await put(`${draftsApiRoot}/${draftId}`, formData);
      }
    // Publish
    } else {
      // Draft not related to an existing entry
      if (draftId && !entryId) {
        resp = await post(addBackdatedTimestamp(entriesApiRoot, backdatedTime), formData);

        if (resp.status === 200) {
          const delResp = await del(`${draftsApiRoot}/${draftId}`);
          handleFormResponseNotification(delResp);
        }
      // Draft related to an existing entry
      } else if (draftId && entryId) {
        resp = await patch(`${entriesApiRoot}/${entryId}`, formData);

        if (resp.status === 200) {
          const delResp = await del(`${draftsApiRoot}/${draftId}`);
          handleFormResponseNotification(delResp);
        }
      // New entry
      } else if (!entryId && !draftId) {
        resp = await post(addBackdatedTimestamp(entriesApiRoot, backdatedTime), formData);
      // Existing entry
      } else {
        resp = await patch(`${entriesApiRoot}/${entryId}`, formData);
      }
    }

    handleFormResponseNotification(resp);
    setSubmitting(false);
    if (resp.status === 200) {
      navigate(`/websites/${websiteId}/collections/${collectionId}/${draft ? 'drafts' : 'entries'}`);
    }
  }

  return (
    <Stack>
      {inputs.length === 0 ? (
        <Text>No Inputs exist for this Collection</Text>
      ) : (
        <>
          {inputs.map((input) => {
            const registryInput = InputRegistry.getInput(input.input);
            if (!registryInput) return null;

            const Component = registryInput.renderInput;
            const settings = {
              ...registryInput.defaultSettings,
              ...(input.inputConfig || {})
            };

            const props: InputProps<any, any> = {
              name: input.name,
              fieldName: input.fieldName,
              description: input.description,
              required: input.required,
              settings,
              value: values[input.id],
              values: getFormData(false),
              onChange: (value) => updateValue(input.id, value),
              registerValidator: (fn) => validators.current[input.id] = fn,
              unregisterValidator: () => delete validators.current[input.id]
            };

            return (
              <Component key={input.fieldName} {...props} />
            );
          })}

          {backdatedTime && (
            <Text c="dimmed" fz="sm">
              This Collection Entry will be backdated to {formatDate(backdatedTime)}.
            </Text>
          )}

          <Modal title="Backdate Post" opened={opened} onClose={close}>
            <DateTimePicker label="Date and Time" value={backdatedTime}
              onChange={setBackdatedTime} clearable minDate={new Date(0)} maxDate={new Date()} />
          </Modal>

          <Grid>
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Button.Group>
                <Button onClick={() => save(false)} loading={submitting} fullWidth
                  disabled={user.role === 'VIEWER'}>
                    {draftId ? 'Publish draft' : 'Save'}
                  </Button>

                  {!entryId && backdatingEnabled && (
                    <Button style={{
                      borderLeft: '1px solid var(--mantine-color-default-border)'
                    }} onClick={open}>
                      <IconButton label="Backdate Collection Entry">
                        <IconCalendarMinus />
                      </IconButton>
                    </Button>
                  )}
                </Button.Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Button onClick={() => save(true)} loading={submitting} fullWidth variant="light"
                disabled={user.role === 'VIEWER'}>
                  {draftId ? 'Update draft' : 'Save as draft'}
                </Button>
            </Grid.Col>
          </Grid>
        </>
      )}
    </Stack>
  );
}
