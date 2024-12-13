import { forwardRef, memo, useCallback, useImperativeHandle, useState } from 'react';
import { useForm } from '@mantine/form';
import { Checkbox, NumberInput, NumberInputProps, TextInput } from '@mantine/core';
import { useListState } from '@mantine/hooks';
import { v4 as uuid } from 'uuid';
import { Input } from '../InputRegistry';
import FlexGrow from '../../client/components/FlexGrow';
import InputArray, { InputArrayBaseValue, UpdateInputArrayWithoutHandler, updateInputArray } from './common/InputArray';

type Value = Record<string, string>

interface TempValue extends InputArrayBaseValue {
  key: string
  value: string
}

interface KeyValueInputSettings {
  maxInputs?: number
  maxKeyLength?: number
  maxValueLength?: number
  required?: boolean
}

const input: Input<Value, KeyValueInputSettings> = {
  id: 'key-value',
  name: 'Key Value',

  deserialize: JSON.parse,
  serialize: JSON.stringify,

  renderInput: () => forwardRef((props, ref) => {
    const convertToTempInput = (value: Value) => {
      if (!props.value) return [];
      return Object.entries(value).map(([k, v]) => ({
        key: k,
        value: v,
        id: uuid()
      }));
    };

    const [inputs, handlers] = useListState<TempValue>(convertToTempInput(props.value));
    const [error, setError] = useState(null);

    useImperativeHandle(ref, () => ({
      getValues: () => inputs.reduce((a, c) => ({
        ...a,
        [c.key]: c.value
      }), {}),
      hasError: () => {
        setError(null);

        if (props.settings?.required && inputs.length === 0) {
          setError(`${input.name} is required`);
          return true;
        }

        if (inputs.some((e) => !e.key || !e.value)) {
          setError('Some inputs have an empty key or value');
          return true;
        }

        return false;
      }
    }));

    const update = useCallback((...params: UpdateInputArrayWithoutHandler) => {
      updateInputArray(handlers, ...params);
    }, []);

    return (
      <InputArray name={props.name} description={props.description} error={error}
        required={props.settings?.required} inputs={inputs} handlers={handlers}
        maxInputs={props.settings?.maxInputs} addInput={() => handlers.append({
          id: uuid(),
          key: '',
          value: ''
        })}>
        {(i) => (
          <>
            <FlexGrow>
              <TextInput label="Key" value={i.key}
                maxLength={props.settings?.maxKeyLength || undefined}
                onChange={(e) => update(i.id, 'key', e.target.value)} />
            </FlexGrow>

            <FlexGrow>
              <TextInput label="Value" value={i.value}
                maxLength={props.settings?.maxValueLength || undefined}
                onChange={(e) => update(i.id, 'value', e.target.value)} />
            </FlexGrow>
          </>
        )}
      </InputArray>
    );
  }),

  deserializeSettings: JSON.parse,
  serializeSettings: JSON.stringify,

  renderSettings: () => forwardRef((props, ref) => {
    const form = useForm({
      mode: 'uncontrolled',
      initialValues: {
        maxInputs: props.settings?.maxInputs || 0,
        maxKeyLength: props.settings?.maxKeyLength || 0,
        maxValueLength: props.settings?.maxValueLength || 0,
        required: props.settings?.required ?? false
      }
    });

    useImperativeHandle(ref, () => ({
      getValues: form.getValues
    }));

    const lengthLimitDescription = 'Set to 0 to disable length limit';
    const LengthInput = memo(({ ...p }: NumberInputProps) => (
      <NumberInput description={lengthLimitDescription} required
        allowNegative={false} allowDecimal={false} {...p} />
    ));

    return (
      <>
        <LengthInput label="Max Inputs" {...form.getInputProps('maxInputs')}
          key={form.key('maxInputs')} />
        <LengthInput label="Max Key Length" {...form.getInputProps('maxKeyLength')}
          key={form.key('maxKeyLength')} />
        <LengthInput label="Max Value Length" {...form.getInputProps('maxValueLength')}
          key={form.key('maxValueLength')} />
        <Checkbox label="Required" {...form.getInputProps('required', { type: 'checkbox' })}
          key={form.key('required')} />
      </>
    );
  }),

  isValid: (stringifiedValue, deserialize, settings) => {
    if (!stringifiedValue) {
      throw new Error('Empty value for Key Value Input');
    }

    const value = deserialize(stringifiedValue);
    if (typeof value !== 'object') {
      throw new Error('Key Value Input must be an object');
    }

    const kvEntries = Object.entries(value);

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

  renderHtml: (value) => value
};

export default input;
