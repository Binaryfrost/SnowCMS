import { useContext, useEffect, useRef, useState } from 'react';
import { Button, Grid, Stack, Text } from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { CollectionInput } from '../../../common/types/CollectionInputs';
import InputRegistry, { type Input, type InputRef } from '../../../common/InputRegistry';
import { HttpResponse, del, patch, post, put } from '../../util/api';
import { handleFormResponseNotification } from '../../util/form';
import { UserContext } from '../../context/UserContext';

type InputsRef = InputRef<any> & Pick<Input<any>, 'serialize'>;

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
  const inputsRef = useRef<Record<string, InputsRef>>({});
  const [submitting, setSubmitting] = useState(false);
  const { user } = useContext(UserContext);
  const values = useRef<Record<string, any>>({});

  function getValues(serialize: boolean = true) {
    return Object.entries(inputsRef.current).reduce((a, [fieldName, input]) => {
      if (input.getValues) {
        const formValues = input.getValues();
        return {
          ...a,
          [fieldName]: serialize ? input.serialize(formValues) : formValues
        };
      }

      return a;
    }, {});
  }

  function notifyChanges() {
    Object.entries(inputsRef.current).forEach(([, input]) => {
      if (input.notifyFormUpdate) {
        input.notifyFormUpdate(getValues());
      }
    });
  }


  async function getFormData(validate: boolean = true) {
    const formData = getValues();
    let hasError = false;
    values.current = formData;

    if (validate) {
      for await (const [, input] of Object.entries(inputsRef.current)) {
        if (input.hasError && await input.hasError()) {
          hasError = true;
        }
      }

      if (hasError) {
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
    }

    return formData;
  }

  async function save(draft: boolean = false) {
    const formData = await getFormData(!draft);
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
        resp = await put(`${entriesApiRoot}/${entryId}`, formData);
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
          {inputs.map((input, index) => {
            const registryInput = InputRegistry.getInput(input.input);
            if (!registryInput) return null;

            const Component = registryInput.renderInput();
            const settings = registryInput.deserializeSettings && input.inputConfig ?
              registryInput.deserializeSettings(input.inputConfig) : null;
            let value;
            if (data || values.current[input.fieldName]) {
              const inputData = data?.filter((d) => d.inputId === input.id)[0]?.data;
              const valueToDeserialize = values.current[input.fieldName] || inputData;
              value = valueToDeserialize ? registryInput.deserialize(valueToDeserialize) : null;
            }

            const props = {
              key: input.fieldName,
              name: input.name,
              fieldName: input.fieldName,
              description: input.description,
              settings,
              value,
              ref: typeof Component !== 'function' ?
                (ref) => inputsRef.current[input.fieldName] = {
                  ...ref,
                  serialize: registryInput.serialize
                } : null,
              notifyChanges
            };

            /**
             * Notify Inputs about the current value so that any Input that requires
             * that data has access to it without requiring user interaction.
             */
            if (index === inputs.length - 1) {
              setTimeout(() => {
                notifyChanges(); 
              });
            }

            return (
              <Component {...props} />
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
