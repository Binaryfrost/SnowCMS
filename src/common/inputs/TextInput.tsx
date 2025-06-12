import { Checkbox, NumberInput, Stack, TextInput } from '@mantine/core';
import { type Input } from '../InputRegistry';
import ExpressError from '../ExpressError';
import { useInputValidator, useSettingsHandler } from './hooks';

interface TextInputSettings {
  maxLength: number
  required: boolean
}

const input: Input<string, TextInputSettings> = {
  id: 'text',
  name: 'Text',

  serialize: (data) => data,
  deserialize: (data) => data,

  renderInput: ({
    name, description, settings, value, onChange, registerValidator, unregisterValidator
  }) => {
    const { maxLength, required } = settings;
    const error = useInputValidator((v) => {
      if (required && !v) return `${name} is required`;
      if (maxLength && maxLength !== 0 && v.length > maxLength) {
        return `${name} has a maximum length of ${maxLength}`;
      }
      return null;
    }, registerValidator, unregisterValidator);

    return (
      <TextInput
        label={name}
        description={description}
        required={required}
        maxLength={maxLength > 1 ? maxLength : null}
        error={error}
        value={value}
        onChange={(v) => onChange(v.target.value)} />
    );
  },

  defaultSettings: {
    maxLength: 0,
    required: true
  },

  renderSettings: ({ settings, onChange, registerValidator, unregisterValidator }) => {
    const errors = useInputValidator<TextInputSettings>(
      (v) => ({
        maxLength: v.maxLength < 0 ? 'Max length must be positive' : null
      }),
      registerValidator,
      unregisterValidator
    );

    const changeSetting = useSettingsHandler(settings, onChange);

    return (
      <Stack>
        <NumberInput label="Max Length" allowDecimal={false}
          description="Set to 0 to disable length limit" required
          error={errors?.maxLength} value={settings.maxLength}
          onChange={(v: number) => changeSetting('maxLength', v)} />
        <Checkbox label="Required" error={errors?.required}
          checked={settings.required}
          onChange={(v) => changeSetting('required', v.target.checked)} />
      </Stack>
    );
  },

  validate: (stringifiedValue, deserialize, settings) => {
    if (settings.required && !stringifiedValue) {
      throw new ExpressError('Required Text Input does not have a value');
    }

    const value = deserialize(stringifiedValue);

    if (settings.maxLength > 0 && value.length > settings.maxLength) {
      throw new ExpressError('Text Input value is longer than allowed');
    }
  },

  validateSettings: (settings) => {
    if (!settings) {
      throw new ExpressError('Settings are required');
    }

    if (typeof settings.maxLength !== 'number') {
      throw new ExpressError('Max Length must be a number');
    }

    if (settings.maxLength < 0) {
      throw new ExpressError('Max Length cannot be negative');
    }

    if (typeof settings.required !== 'boolean') {
      throw new ExpressError('Required must be a boolean');
    }
  },

  renderHtml: (value) => value
};

export default input;
