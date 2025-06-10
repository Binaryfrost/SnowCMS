import { useContext, useEffect, useRef, useState } from 'react';
import { Button, Grid, Stack, Text } from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { CollectionInput } from '../../../common/types/CollectionInputs';
import InputRegistry, {
  InputProps, RegisterValidatorFunction, type Input
} from '../../../common/InputRegistry';
import { HttpResponse, del, patch, post, put } from '../../util/api';
import { handleFormResponseNotification } from '../../util/form';
import { UserContext } from '../../context/UserContext';

interface Props {
  entryId?: string
  draftId?: string
  inputs: CollectionInput[]
  data?: {
    inputId: string
    data: string
  }[]
}

export default function CollectionEntryEditorForm({ entryId, draftId, inputs, data }: Props) {
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
    return getRegistryInput(id).serialize(value);
  }

  function deserialize<T = any>(id: string, value: string): T {
    return getRegistryInput<T>(id).deserialize(value);
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

    let resp: HttpResponse;
    setSubmitting(true);

    if (draft) {
      if (!draftId) {
        const url = entryId ? `${draftsApiRoot}?entry=${entryId}` : draftsApiRoot;
        resp = await post(url, formData);
      } else {
        resp = await put(`${draftsApiRoot}/${draftId}`, formData);
      }
    } else {
      if (draftId && !entryId) {
        resp = await post(entriesApiRoot, formData);

        if (resp.status === 200) {
          const delResp = await del(`${draftsApiRoot}/${draftId}`);
          handleFormResponseNotification(delResp);
        }
      } else if (draftId && entryId) {
        resp = await patch(`${entriesApiRoot}/${entryId}`, formData);

        if (resp.status === 200) {
          const delResp = await del(`${draftsApiRoot}/${draftId}`);
          handleFormResponseNotification(delResp);
        }
      } else if (!entryId && !draftId) {
        resp = await post(entriesApiRoot, formData);
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
            const settings = input.inputConfig || {};

            const props: InputProps<any, any> = {
              name: input.name,
              fieldName: input.fieldName,
              description: input.description,
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

          <Grid>
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Button onClick={() => save(false)} loading={submitting} fullWidth
                disabled={user.role === 'VIEWER'}>
                  {draftId ? 'Publish draft' : 'Save'}
                </Button>
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
