import { forwardRef, useImperativeHandle } from 'react';
import { Textarea } from '@mantine/core';
import { useField } from '@mantine/form';
import TextInput from './TextInput';

const input: typeof TextInput = {
  ...TextInput,

  id: 'textarea',
  name: 'Text Area',

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
      <Textarea label={props.name} description={props.description} required={required}
        maxLength={maxLength > 1 ? maxLength : null} {...field.getInputProps()} />
    );
  })
};

export default input;
