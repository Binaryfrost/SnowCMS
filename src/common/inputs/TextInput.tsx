import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Checkbox, NumberInput, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { type Input } from '../InputRegistry';

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
    const valueRef = useRef<string>(props.value || '');

    useImperativeHandle(ref, () => ({
      getValues: () => valueRef.current,
      notifyFormUpdate: (values) => {
        console.log('form fields updated', values);
      }
    }));

    console.log('settings', props.settings);
    console.log('value', props.value);

    return (
      <TextInput label={props.name} description={props.description} {...props.settings}
        defaultValue={props.value} onChange={(e) => valueRef.current = e.target.value} />
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
      })
    });

    useImperativeHandle(ref, () => ({
      getValues: () => form.getValues(),
      hasError: () => form.validate().hasErrors
    }));

    useEffect(() => {
      form.validate();
    }, []);

    console.log('settings', props.settings);

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

  renderHtml: (value) => value
};

export default input;
