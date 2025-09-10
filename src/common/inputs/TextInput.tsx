import { Checkbox, NumberInput, Stack, TextInput } from '@mantine/core';
import { type Input } from '../InputRegistry';
import ExpressError from '../ExpressError';
import { useInputValidator, useSettingsHandler } from './hooks';

interface TextInputSettings {
  maxLength: number
}

const input: Input<string, TextInputSettings> = {
  id: 'text',
  name: 'Text',

  serialize: (data) => data,
  deserialize: (data) => data,

  renderInput: ({
    name, description, required, settings, value, onChange, registerValidator, unregisterValidator
  }) => {
    const { maxLength } = settings;
    const error = useInputValidator((v) => {
      if (required && !v) return `${name} is required`;
      if (maxLength && maxLength !== 0 && v?.length > maxLength) {
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
        value={value || ''}
        onChange={(v) => onChange(v.target.value)} />
    );
  },

  defaultSettings: {
    maxLength: 0
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
      </Stack>
    );
  },

  validate: (stringifiedValue, deserialize, required, settings) => {
    if (required && !stringifiedValue) {
      throw new ExpressError('Required Text Input does not have a value');
    }

    const value = deserialize(stringifiedValue);

    if (settings.maxLength > 0 && value.length > settings.maxLength) {
      throw new ExpressError('Text Input value is longer than allowed');
    }
  },

  validateSettings: (settings) => {
    if (typeof settings.maxLength !== 'number') {
      throw new ExpressError('Max Length must be a number');
    }

    if (settings.maxLength < 0) {
      throw new ExpressError('Max Length cannot be negative');
    }
  },

  renderHtml: (value) => value
};

export default input;
