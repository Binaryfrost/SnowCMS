import { ChangeEvent, useRef, useState } from 'react';
import { Button, Group, Stack, TextInput } from '@mantine/core';
import { type UseListStateHandlers } from '@mantine/hooks';
import InputRegistry, {
  ValidateFunctionErrorObject, ValidatorFunction
} from '../../../common/InputRegistry';
import type { CollectionInput, CollectionInputSettings } from '../../../common/types/CollectionInputs';

interface Props {
  collectionInput: CollectionInput
  close: () => void
  update: (item: Parameters<UseListStateHandlers<CollectionInput>['applyWhere']>[1]) => void
}

export default function CollectionInputSettingsForm({ collectionInput, close, update }: Props) {
  const settingsInput = InputRegistry.getInput(collectionInput.input);
  const [errors, setErrors] = useState<ValidateFunctionErrorObject<CollectionInput>>({});
  const [settings, setSettings] = useState<CollectionInputSettings>({
    name: collectionInput.name || '',
    fieldName: collectionInput.fieldName || '',
    description: collectionInput.description || '',
    inputConfig: collectionInput.inputConfig || {}
  });
  const validator = useRef<ValidatorFunction<any>>();

  const InputSettings = settingsInput.renderSettings;
  const mergedInputConfig = {
    ...settingsInput.defaultSettings,
    ...settings.inputConfig
  };

  function validate() {
    const errors: ValidateFunctionErrorObject<CollectionInputSettings> = {
      name: !settings.name ? 'Name is required' : null,
      fieldName: !settings.fieldName ? 'Field name is required' : null
    }
    return errors;
  }

  async function save() {
    const errors = validate();
    setErrors(errors);
    const commonSettingsHasError = Object.values(errors).some(Boolean);

    let inputSettingsHasError = false;
    if (settings.inputConfig) {
      inputSettingsHasError = validator.current?.(settings.inputConfig);
    }

    if (commonSettingsHasError || inputSettingsHasError) return;

    const { name, fieldName, description, inputConfig } = settings;
    
    update((input) => ({
      ...input,
      name,
      fieldName,
      description,
      inputConfig
    }));
  }
  
  function onChange(setting: keyof CollectionInputSettings, value: any) {
    setSettings((settings) => ({
      ...settings,
      [setting]: value
    }));
  }

  function onChangeInput(setting: keyof CollectionInputSettings, e: ChangeEvent<HTMLInputElement>) {
    onChange(setting, e.target.value)
  }

  function onChangeConfig(value: Record<string, any>) {
    onChange('inputConfig', value || {});
  }

  return (
    <>
      <Stack gap="sm">
        <TextInput label="Name" required error={errors.name}
          value={settings.name} onChange={(e) => onChangeInput('name', e)} />
        <TextInput label="Field Name" required error={errors.fieldName}
          description="Used as the key in the API response"
          value={settings.fieldName} onChange={(e) => onChangeInput('fieldName', e)} />
        <TextInput label="Description" error={errors.description}
          value={settings.description} onChange={(e) => onChangeInput('description', e)} />
        {InputSettings && (
          <InputSettings
            settings={mergedInputConfig}
            onChange={onChangeConfig}
            registerValidator={(fn) => validator.current = fn}
            unregisterValidator={() => validator.current = null}
          />
        )}
      </Stack>

      <Group justify="end" mt="md">
        <Button color="gray" variant="default" onClick={close}>Cancel</Button>
        <Button onClick={save}>Save</Button>
      </Group>
    </>
  );
}
