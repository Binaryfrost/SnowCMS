import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { Checkbox, NumberInput, Stack, TextInput } from '@mantine/core';
import { useField, useForm } from '@mantine/form';
import { type Input } from '../InputRegistry';
import ExpressError from '../ExpressError';

interface TextInputSettings {
  maxLength: number
  required: boolean
}

const input: Input<string, TextInputSettings> = {
  id: 'text',
  name: 'Text',

  serialize: (data) => data,
  deserialize: (data) => data,

  renderInput: () => forwardRef((props, ref) => {
    const { maxLength, required } = props.settings;
    const field = useField({
      mode: 'uncontrolled',
      initialValue: props.value || '',
      validateOnChange: true,
      validate: (value) => {
        if (required && !value) return `${props.name} is required`;
        if (maxLength && maxLength !== 0 && value.length > maxLength) {
          return `${props.name} has a maximum length of ${maxLength}`;
        }
        return null;
      },
      onValueChange: props.notifyChanges
    });

    useImperativeHandle(ref, () => ({
      getValues: () => field.getValue(),
      hasError: async () => !!(await field.validate())
    }));

    return (
      <TextInput label={props.name} description={props.description} required={required}
        maxLength={maxLength > 1 ? maxLength : null} {...field.getInputProps()} />
    );
  }),

  serializeSettings: (data) => JSON.stringify(data),
  deserializeSettings: (data) => JSON.parse(data),

  renderSettings: () => forwardRef((props, ref) => {
    const form = useForm({
      mode: 'uncontrolled',
      initialValues: {
        maxLength: props.settings?.maxLength || 0,
        required: props.settings?.required ?? true
      },
      validateInputOnChange: true,
      validate: (values) => ({
        maxLength: values.maxLength < 0 ? 'Max length must be positive' : null
      }),
    });

    useImperativeHandle(ref, () => ({
      getValues: () => form.getValues(),
      hasError: () => form.validate().hasErrors
    }));

    useEffect(() => {
      form.validate();
    }, []);

    return (
      <Stack>
        <NumberInput label="Max Length" allowDecimal={false}
          description="Set to 0 to disable length limit" required
          {...form.getInputProps('maxLength')} key={form.key('maxLength')} />
        <Checkbox label="Required" {...form.getInputProps('required', { type: 'checkbox' })}
          key={form.key('required')} />
      </Stack>
    );
  }),

  validate: (stringifiedValue, deserialize, settings) => {
    if (settings.required && !stringifiedValue) {
      throw new ExpressError('Required Text Input does not have a value');
    }

    const value = deserialize(stringifiedValue);

    if (settings.maxLength > 0 && value.length > settings.maxLength) {
      throw new ExpressError('Text Input value is longer than allowed');
    }
  },

  validateSettings: (serializedSettings, deserialize) => {
    if (!serializedSettings) {
      throw new ExpressError('Settings are required');
    }

    const settings = deserialize(serializedSettings);

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
