import { useContext, useRef, useState } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import DataGetter from '../DataGetter';
import { CollectionInput } from '../../../common/types/CollectionInputs';
import InputRegistry, { type Input, type InputRef } from '../../../common/InputRegistry';
import { HttpResponse, patch, post } from '../../util/api';
import { handleFormResponseNotification } from '../../util/form';
import FormSkeleton from '../FormSkeleton';
import { CollectionEntryWithData } from '../../../common/types/CollectionEntry';
import { UserContext } from '../../context/UserContext';

type InputsRef = InputRef<any> & Pick<Input<any>, 'serialize'>;

interface Props {
  entryId?: string
}

export default function CollectionEntryForm({ entryId }: Props) {
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

  async function save() {
    const formData = getValues();
    let hasError = false;
    values.current = formData;

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

    const apiRoot = `/api/websites/${websiteId}/collections/${collectionId}/entries`;

    let resp: HttpResponse;
    setSubmitting(true);
    if (entryId) {
      resp = await patch(`${apiRoot}/${entryId}`, formData);
    } else {
      resp = await post(apiRoot, formData);
    }

    handleFormResponseNotification(resp);
    setSubmitting(false);
    if (resp.status === 200) {
      navigate(`/websites/${websiteId}/collections/${collectionId}/entries`);
    }
  }

  return (
    <DataGetter.Multiple<[CollectionInput[], CollectionEntryWithData]>
      skeletonComponent={<FormSkeleton />}
      urls={[
        `/api/websites/${websiteId}/collections/${collectionId}/inputs`,
        entryId ? `/api/websites/${websiteId}/collections/${collectionId}/entries/${entryId}` : null
      ].filter(Boolean)}>
      {({ data: [inputs, data] }) => (
        <Stack>
          {inputs.length === 0 ? (
            <Text>No Inputs exist for this Collection</Text>
          ) : (
            <>
              {inputs.map((input) => {
                const registryInput = InputRegistry.getInput(input.input);
                if (!registryInput) return null;

                const Component = registryInput.renderInput();
                const settings = registryInput.deserializeSettings && input.inputConfig ?
                  registryInput.deserializeSettings(input.inputConfig) : null;
                let value;
                if (data || values.current[input.fieldName]) {
                  const inputData = data?.data.filter((d) => d.inputId === input.id)[0]?.data;
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

                return (
                  <Component {...props} />
                );
              })}

              <Button onClick={save} loading={submitting}
                disabled={user.role === 'VIEWER'}>Save</Button>
            </>
          )}
        </Stack>
      )}
    </DataGetter.Multiple>
  );
}
