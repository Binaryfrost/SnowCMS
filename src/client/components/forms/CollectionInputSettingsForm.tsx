import { useRef } from 'react';
import { Button, Group, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { type UseListStateHandlers } from '@mantine/hooks';
import InputRegistry, { type InputRef } from '../../../common/InputRegistry';
import type { CollectionInput } from '../../../common/types/CollectionInputs';

interface Props {
  collectionInput: CollectionInput
  close: () => void
  update: (item: Parameters<UseListStateHandlers<CollectionInput>['applyWhere']>[1]) => void
}

export default function CollectionInputSettingsForm({ collectionInput, close, update }: Props) {
  const settingsInput = InputRegistry.getInput(collectionInput.input);
  const settingsRef = useRef<InputRef<any>>(null);
  const InputSettings = settingsInput.renderSettings ? settingsInput.renderSettings() : null;

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: collectionInput.name || '',
      fieldName: collectionInput.fieldName || '',
      description: collectionInput.description || '',
      settings: collectionInput.inputConfig || ''
    },
    validateInputOnChange: true,
    validate: (values) => ({
      name: !values.name ? 'Name is required' : null,
      fieldName: !values.fieldName ? 'Field name is required' : null
    })
  });

  async function save() {
    let settingsHasError = false;
    if (InputSettings && settingsRef.current) {
      const getSettingsFn = settingsRef.current.getValues;
      const hasErrorFn = settingsRef.current.hasError;

      if (getSettingsFn) {
        form.setFieldValue('settings', settingsInput.serializeSettings(getSettingsFn()));
      }

      settingsHasError = hasErrorFn ? await hasErrorFn() : false;
    }

    if (!form.validate().hasErrors && !settingsHasError) {
      console.log(form.getValues());

      const formValues = form.getValues();
      update((input) => ({
        ...input,
        name: formValues.name,
        fieldName: formValues.fieldName,
        description: formValues.description,
        inputConfig: formValues.settings
      }));
    }
  }

  return (
    <>
      <Stack gap="sm">
        <TextInput label="Name" required {...form.getInputProps('name')} key={form.key('name')} />
        <TextInput label="Field Name" required description="Used as the key in the API response"
          {...form.getInputProps('fieldName')} key={form.key('fieldName')} />
        <TextInput label="Description" {...form.getInputProps('description')}
          key={form.key('description')} />
        {InputSettings && (
          <InputSettings settings={form.getValues().settings ?
            settingsInput.deserializeSettings(form.getValues().settings) : null}
            ref={settingsRef} />
        )}
      </Stack>

      <Group justify="end" mt="md">
        <Button color="gray" variant="default" onClick={close}>Cancel</Button>
        <Button onClick={save}>Save</Button>
      </Group>
    </>
  );
}
