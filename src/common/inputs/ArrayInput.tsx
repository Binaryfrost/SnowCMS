import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { Checkbox, Select, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useListState } from '@mantine/hooks';
import { v4 as uuid } from 'uuid';
import InputRegistry, { InputRef, type Input } from '../InputRegistry';
import InputArray, { InputArrayBaseValue, UpdateInputArrayWithoutHandler, updateInputArray } from './common/InputArray';
import FlexGrow from '../../client/components/FlexGrow';

interface ArrayInputSettings {
  input: string
  maxInputs: number,
  required: boolean
  inputConfig: any
}

interface TempValue extends InputArrayBaseValue {
  value: any
}

function getInput(id: string) {
  const registryInputs = InputRegistry.getAllInputs();
  return registryInputs[id];
}

const INPUT_ID = 'array';

const input: Input<any[], ArrayInputSettings> = {
  id: INPUT_ID,
  name: 'Array of Inputs',

  serialize: JSON.stringify,
  deserialize: JSON.parse,

  renderInput: () => forwardRef((props, ref) => {
    const selectedInput = getInput(props.settings?.input);
    const RenderedInput = selectedInput ? selectedInput.renderInput() : null;
    const inputConfig = selectedInput && props.settings?.inputConfig ?
      selectedInput.deserializeSettings(props.settings?.inputConfig) : null;

    const convertToTempInput = (value: any[]) => {
      if (!value) return [];
      return value.map((v) => ({
        id: uuid(),
        value: selectedInput ? selectedInput.deserialize(v) : null
      }));
    };

    const [inputs, handlers] = useListState<TempValue>(convertToTempInput(props.value));
    const inputsRef = useRef<{ id: string, ref: InputRef<any>}[]>([]);
    const [error, setError] = useState(null);

    console.log('array', inputs, props.value);

    useImperativeHandle(ref, () => ({
      getValues: () => inputsRef.current.map((i) => {
        const { getValues } = i.ref;
        return getValues ? selectedInput.serialize(getValues()) : null;
      }),
      hasError: () => {
        const inputError = inputsRef.current.some((i) => {
          const { hasError } = i.ref;
          return hasError ? hasError() : null;
        });

        if (inputError) return true;

        if (props.settings?.required && inputs.length === 0) {
          setError(`${props.name} is required`);
          return true;
        }

        return false;
      }
    }));

    const update = useCallback((...params: UpdateInputArrayWithoutHandler) => {
      updateInputArray(handlers, ...params);
    }, []);

    const syncState = useCallback(() => {
      inputsRef.current.forEach((i) => {
        /*
         * This function is called after an input is added or removed, so it's possible for the
         * ref array to be slightly outdated when this code runs.
         */
        if (i.ref) {
          const { getValues } = i.ref;
          if (getValues) {
            update(i.id, 'value', getValues());
          }
        }
      });
    }, []);

    return selectedInput && typeof RenderedInput === 'object' && (
      <InputArray name={props.name} description={props.description} error={error}
        required={props.settings?.required} inputs={inputs} handlers={handlers}
        maxInputs={props.settings?.maxInputs} addInput={() => {
          syncState();
          handlers.append({
            id: uuid(),
            value: null
          });
        }} inputRemoved={(_, index) => {
          syncState();
          // Run on next tick so the state has time to update first
          setTimeout(() => {
            inputsRef.current.splice(index, 1);
          });
        }}>
        {(i, index) => (
          <FlexGrow>
            <RenderedInput name={`${props.name} (${index + 1} of ${inputs.length})`} value={i.value}
              settings={inputConfig} notifyChanges={props.notifyChanges}
              fieldName={null} ref={(r: InputRef<any>) => inputsRef.current[index] = {
                id: i.id,
                ref: r
              }} />
          </FlexGrow>
        )}
      </InputArray>
    );
  }),

  serializeSettings: JSON.stringify,
  deserializeSettings: JSON.parse,

  renderSettings: () => forwardRef((props, ref) => {
    const form = useForm({
      // This intentionally uses controlled mode to ensure that the InputSettings component updates
      mode: 'controlled',
      initialValues: {
        input: props.settings?.input || '',
        maxInputs: props.settings?.maxInputs || 0,
        required: props.settings?.required ?? false
      },
      validate: {
        input: (value) => (!value ? 'Input is required' : null)
      },
      validateInputOnChange: true,
    });
    const settingsRef = useRef<InputRef<any>>(null);
    const inputs = InputRegistry.getAllInputs();
    const selectedInput = inputs[form.getValues().input];
    const InputSettings = selectedInput && selectedInput.renderSettings ?
      selectedInput.renderSettings() : null;

    useImperativeHandle(ref, () => ({
      getValues: () => ({
        ...form.getValues(),
        inputConfig: settingsRef.current?.getValues ?
          selectedInput.serializeSettings(settingsRef.current.getValues()) : null
      })
    }));

    return (
      <>
        <Select label="Input" required searchable nothingFoundMessage="No Input found"
          data={Object.values(inputs)
            .filter((i) => i.id !== INPUT_ID)
            .map((i) => ({
              label: `${i.name} (${i.id})`,
              value: i.id
            }))} {...form.getInputProps('input')} />

        <TextInput label="Max Inputs" required description="Set to 0 to disable limit"
          {...form.getInputProps('maxInputs')} />
        <Checkbox label="Required" {...form.getInputProps('required', { type: 'checkbox' })} />

        {InputSettings && (
          <>
            <Text fz="md" fw="bold">Input Settings</Text>
            <InputSettings settings={props.settings?.inputConfig ?
              selectedInput.deserializeSettings(props.settings.inputConfig) : null}
              ref={settingsRef} />
          </>
        )}
      </>
    );
  }),

  renderHtml: (value, settings, req) => {
    console.log('array', value, settings);
    const selectedInput = getInput(settings?.input);
    if (!input) return null;
    const inputConfig = selectedInput.deserializeSettings && settings?.inputConfig ?
      selectedInput.deserializeSettings(settings?.inputConfig) : null;

    const values = value.map((v) => selectedInput.renderHtml(
      selectedInput.deserialize(v), inputConfig, req));

    return Promise.all(values);
  }
};

export default input;
