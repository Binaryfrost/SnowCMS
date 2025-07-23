import { Checkbox, NumberInput, NumberInputProps } from '@mantine/core';
import { Input } from '../InputRegistry';
import ExpressError from '../ExpressError';
import { useInputValidator, useSettingsHandler } from './hooks';
import KeyValueInputArray from './common/KeyValueInputArray';

// TODO: Write migration to remove legacy value
type LegacyValue = Record<string, string>
type Value = [string, string][]

interface KeyValueInputSettings {
  maxInputs?: number
  maxKeyLength?: number
  maxValueLength?: number
  required?: boolean
}

function convertToArray(v: LegacyValue | Value): Value {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return Object.entries(v);
}

function LengthInput({ ...p }: NumberInputProps) {
  const lengthLimitDescription = 'Set to 0 to disable length limit';
  return <NumberInput description={lengthLimitDescription} required
    allowNegative={false} allowDecimal={false} {...p} />
}

const input: Input<LegacyValue | Value, KeyValueInputSettings> = {
  id: 'key-value',
  name: 'Key Value',

  deserialize: JSON.parse,
  serialize: JSON.stringify,

  renderInput: ({
    name, description, value, settings, onChange, registerValidator, unregisterValidator
  }) => {
    const internalState = convertToArray(value);

    const error = useInputValidator(
      (v) => {
        const is = convertToArray(v);

        if (settings.required && is.length === 0) {
          return `${input.name} is required`;
        }

        if (is.some(([key, value]) => !key || !value)) {
          return 'Some inputs have an empty key or value';
        }
      },
      registerValidator,
      unregisterValidator
    );

    return (
      <KeyValueInputArray
        name={name}
        description={description}
        error={error}
        required={settings.required}
        maxInputs={settings.maxInputs}
        maxKeyLength={settings.maxKeyLength}
        maxValueLength={settings.maxValueLength}
        value={internalState}
        onChange={(v) => {
          if (typeof v === 'function') {
            onChange(v(internalState));
          } else {
            onChange(v);
          }
        }} />
    )
  },

  defaultSettings: {
    maxInputs: 0,
    maxKeyLength: 0,
    maxValueLength: 0,
    required: false
  },

  renderSettings: ({
    settings, onChange
  }) => {
    const setSetting = useSettingsHandler(settings, onChange);

    return (
      <>
        <LengthInput label="Max Inputs" value={settings.maxInputs}
          onChange={(v: number) => setSetting('maxInputs', v)} />
        <LengthInput label="Max Key Length" value={settings.maxKeyLength}
          onChange={(v: number) => setSetting('maxKeyLength', v)} />
        <LengthInput label="Max Value Length" value={settings.maxValueLength}
          onChange={(v: number) => setSetting('maxValueLength', v)} />
        <Checkbox label="Required" checked={settings.required}
          onChange={(e) => setSetting('required', e.target.checked)} />
      </>
    );
  },

  validate: (stringifiedValue, deserialize, settings) => {
    if (!stringifiedValue) {
      throw new Error('Empty value for Key Value Input');
    }

    const value = deserialize(stringifiedValue);
    if (typeof value !== 'object') {
      throw new Error('Key Value Input must be an object');
    }

    const kvEntries = convertToArray(value);

    if (settings.required && kvEntries.length === 0) {
      throw new Error('Required Key Value Input does not have a value');
    }

    if (settings.maxInputs > 0 && kvEntries.length > settings.maxInputs) {
      throw new Error('Key Value Input has more inputs than allowed');
    }

    if (settings.maxKeyLength > 0 && kvEntries.some(([k]) => k.length > settings.maxKeyLength)) {
      throw new Error('At least one key of Key Value Input is longer than allowed');
    }

    if (settings.maxValueLength > 0 &&
      kvEntries.some(([, v]) => v.length > settings.maxValueLength)) {
      throw new Error('At least one value of Key Value Input is longer than allowed');
    }
  },

  validateSettings: (settings) => {
    const fieldsToValidate = ['maxInputs', 'maxKeyLength', 'maxValueLength'];
    fieldsToValidate.forEach((field) => {
      if (typeof settings[field] !== 'number') {
        throw new ExpressError(`${field} must be a number`);
      }

      if (settings[field] < 0) {
        throw new ExpressError(`${field} cannot be negative`);
      }
    });

    if (typeof settings.required !== 'boolean') {
      throw new ExpressError('Required must be a boolean');
    }
  },

  renderHtml: (value) => {
    const v = convertToArray(value);

    return v.reduce((a, [k, v]) => ({
      ...a,
      [k]: v
    }), {});
  }
};

export default input;
