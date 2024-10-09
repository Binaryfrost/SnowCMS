import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Checkbox, NumberInput, Stack, TextInput } from '@mantine/core';
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
    const valueRef = useRef<TextInputSettings>(props.settings || {
      maxLength: 0,
      required: true
    });

    useImperativeHandle(ref, () => ({
      getValues: () => valueRef.current
    }));

    console.log('settings', props.settings);

    return (
      <Stack>
        <NumberInput label="Max Length" defaultValue={props.settings.maxLength}
          allowDecimal={false} description="Set to 0 to disable length limit"
          // Value can be a string or number, so always convert it to string and parse as integer
          onChange={(e) => valueRef.current.maxLength = parseInt(e.toString(), 10)} required />
        <Checkbox label="Required" defaultChecked={props.settings.required}
          onChange={(e) => valueRef.current.required = e.target.checked} required />
      </Stack>
    );
  }),

  renderHtml: (value) => value
};

export default input;
