import { useRef } from 'react';
import { Checkbox, NumberInput, Select, Text } from '@mantine/core';
import { v7 as uuid } from 'uuid';
import InputRegistry, { RegisterValidatorFunction, ValidatorFunction, type Input } from '../InputRegistry';
import InputArray from './common/InputArray';
import FlexGrow from '../../client/components/FlexGrow';
import ExpressError from '../ExpressError';
import { useInputValidator, useSettingsHandler } from './hooks';

interface ArrayInputSettings {
  input: string
  maxInputs: number,
  required: boolean
  inputConfig: Record<string, any>
}

function getInput(id: string) {
  const registryInputs = InputRegistry.getAllInputs();
  return registryInputs[id];
}

function mergeChildSettings(input: Input<any, any>, inputConfig: Record<string, any>) {
  return {
    ...input.defaultSettings,
    ...(inputConfig || {})
  };
}

const INPUT_ID = 'array';

type Value = [string, any][]

const input: Input<Value, ArrayInputSettings> = {
  id: INPUT_ID,
  name: 'Array of Inputs',

  serialize: (value) => JSON.stringify(value ? value.map(([, v]) => v) : []),
  deserialize: (value) => {
    if (!value) return [];
    const parsed: any[] = JSON.parse(value);
    return parsed.map((v) => [uuid(), v]);
  },

  renderInput: ({
    name,
    fieldName,
    description,
    value,
    values,
    settings,
    onChange,
    registerValidator,
    unregisterValidator
  }) => {
    const validators = useRef<RegisterValidatorFunction<any>[]>([]);

    const error = useInputValidator(
      (v) => {
        const childrenHaveErrors = validators.current
          .map((fn, i) => fn(v[i][1]))
          .some(Boolean);

        if (childrenHaveErrors) return 'One or more inputs have errors';

        return settings.required &&
          (!v || v.length === 0) ? `${name} is required` : null;
      },
      registerValidator,
      unregisterValidator
    );

    const selectedInput = getInput(settings.input);
    const RenderedInput = selectedInput?.renderInput;
    const internalValue: Value = selectedInput ? (value || [])
        .map(([id, value]) => [id, selectedInput.deserialize(value)]) : [];

    function updateValue() {
      onChange(
        internalValue
        .map(([id, value]) => [id, selectedInput.serialize(value)])
      );
    }

    return RenderedInput && (
      <InputArray name={name} description={description} error={error}
        required={settings.required} inputs={internalValue || []}
        maxInputs={settings.maxInputs} addInput={() => {
          internalValue.push([uuid(), null]);
          updateValue();
        }} removeInput={(index) => {
          validators.current.splice(index, 1);
          internalValue.splice(index, 1);
          updateValue();
        }}>
        {(i, index) => (
          <FlexGrow>
            <RenderedInput key={i[0]}
              name={`${name} (${index + 1} of ${internalValue.length})`}
              value={i[1]}
              values={values}
              settings={mergeChildSettings(input, settings.inputConfig)}
              fieldName={fieldName}
              onChange={(v) => {
                internalValue[index][1] = v;
                updateValue();
              }}
              registerValidator={(fn) => validators.current[index] = fn}
              unregisterValidator={() => validators.current.splice(index, 1)}
               />
          </FlexGrow>
        )}
      </InputArray>
    );
  },

  defaultSettings: {
    input: '',
    maxInputs: 0,
    required: false,
    inputConfig: {}
  },

  renderSettings: ({
    settings, onChange, registerValidator, unregisterValidator
  }) => {
    const validator = useRef<ValidatorFunction<any>>(null);

    const setSetting = useSettingsHandler(settings, onChange);

    const errors = useInputValidator(
      (v) => ({
        input: !v.input ? 'Input is required' : null,
        inputConfig: validator.current?.(v.inputConfig) ?
          'Input settings has an error' : null
      }),
      registerValidator,
      unregisterValidator
    );

    const inputs = InputRegistry.getAllInputs();
    const selectedInput = inputs[settings.input];
    const InputSettings = selectedInput?.renderSettings;

    return (
      <>
        <Select label="Input" required searchable nothingFoundMessage="No Input found"
          data={Object.values(inputs)
            .filter((i) => i.id !== INPUT_ID)
            .map((i) => ({
              label: `${i.name} (${i.id})`,
              value: i.id
            }))} error={errors?.input} value={settings.input}
            onChange={(v) => setSetting('input', v)} />

        <NumberInput label="Max Inputs" required description="Set to 0 to disable limit"
          allowDecimal={false} allowNegative={false} value={settings.maxInputs}
          onChange={(v: number) => setSetting('maxInputs', v)} />

        <Checkbox label="Required" checked={settings.required}
          onChange={(e) => setSetting('required', e.target.checked)} />

        {InputSettings && (
          <>
            <Text fz="md" fw="bold">Input Settings</Text>
            <InputSettings settings={mergeChildSettings(input, settings.inputConfig)}
              onChange={(v) => setSetting('inputConfig', v)}
              registerValidator={(fn) => validator.current = fn}
              unregisterValidator={() => validator.current = null} />
          </>
        )}
      </>
    );
  },

  validate: (stringifiedValue, deserialize, settings) => {
    if (!stringifiedValue) {
      throw new Error('Empty value for Array Input');
    }

    const value = deserialize(stringifiedValue);

    if (!Array.isArray(value)) {
      throw new Error('Array Input must be a value');
    }

    if (settings.required && value.length === 0) {
      throw new Error('Required Array Input does not have a value');
    }

    if (settings.maxInputs > 0 && value.length > settings.maxInputs) {
      throw new Error('Array Input has more inputs than allowed');
    }
  },

  validateSettings: async (settings, req) => {
    if (!settings.input) {
      throw new ExpressError('Input is required');
    }

    if (typeof settings.input !== 'string') {
      throw new ExpressError('Input must be a string');
    }

    if (settings.input === INPUT_ID) {
      throw new ExpressError('Input cannot be another Array Input');
    }

    const selectedInput = getInput(settings.input);

    if (!selectedInput) {
      throw new ExpressError('Input does not exist');
    }

    if (typeof settings.maxInputs !== 'number') {
      throw new ExpressError('Max Input must be a number');
    }

    if (settings.maxInputs < 0) {
      throw new ExpressError('Max Inputs cannot be negative');
    }

    if (typeof settings.required !== 'boolean') {
      throw new ExpressError('Required must be a boolean');
    }

    await selectedInput.validateSettings?.(
      settings.inputConfig, req
    );
  },

  renderHtml: (value, settings, req) => {
    if (!value) return [];

    const selectedInput = getInput(settings?.input);
    if (!input) return null;
    const inputConfig = settings?.inputConfig;

    const values = value.map((v) => selectedInput.renderHtml(
      selectedInput.deserialize(v[1]), inputConfig, req));

    return Promise.all(values);
  }
};

export default input;
