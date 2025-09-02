import { Checkbox, Select, Stack } from '@mantine/core';
import type { Input } from '../InputRegistry'
import { useInputValidator, useSettingsHandler } from './hooks';
import KeyValueInputArray from './common/KeyValueInputArray';
import ExpressError from '../ExpressError';


interface SelectInputSettings {
  options: [string, string][]
  required: boolean
}

const input: Input<string, SelectInputSettings> = {
  id: 'select',
  name: 'Select',

  deserialize: (data) => data,
  serialize: (data) => data,

  renderInput: ({
    name, description, value, settings, onChange, registerValidator, unregisterValidator
  }) => {
    const error = useInputValidator((v) => {
      return !v && settings.required ? `${name} is required` : null
    }, registerValidator, unregisterValidator);

    return (
      <Select
        label={name}
        description={description}
        value={value}
        data={settings.options.map(([value, label]) => ({
          label,
          value
        }))}
        required={settings.required}
        error={error}
        onChange={onChange}
        allowDeselect={false}
        searchable />
    );
  },

  validate: (serializedValue, deserialize, settings) => {
    if (!serializedValue && settings.required) {
      throw new ExpressError('Empty value for Select Input');
    }
    

    if (serializedValue && !settings.options.map(([key]) => key).includes(serializedValue)) {
      throw new ExpressError('Invalid option selected');
    }
  },

  defaultSettings: {
    options: [],
    required: false
  },

  renderSettings: ({ settings, onChange, registerValidator, unregisterValidator }) => {
    const errors = useInputValidator((v) => {
      return {
        options: (() => {
          if (!v.options || v.options.length === 0) return 'At least one option must be set';
          if (v.options?.some(([key, value]) => !key?.trim() || !value?.trim())) {
            return 'A key or value was left empty';
          }
        })()
      }
    }, registerValidator, unregisterValidator);
    const setSetting = useSettingsHandler(settings, onChange);

    return (
      <Stack>
        <KeyValueInputArray
          name={'Options'}
          value={settings.options}
          labels={['Value', 'Label']}
          onChange={((v) => {
            if (typeof v === 'function') {
              setSetting('options', v(settings.options));
            } else {
              setSetting('options', v);
            }
          })}
          error={errors?.options}
          required />

        <Checkbox
          label="Required"
          checked={settings.required}
          onChange={(e) => setSetting('required', e.target.checked)} />
      </Stack>
    );
  },

  renderHtml: () => {
    return null;
  }
};

export default input;
