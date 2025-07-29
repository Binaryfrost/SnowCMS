import { Textarea } from '@mantine/core';
import TextInput from './TextInput';
import { useInputValidator } from './hooks';

const input: typeof TextInput = {
  ...TextInput,

  id: 'textarea',
  name: 'Text Area',

  renderInput: ({
    name, description, value, settings, onChange, registerValidator, unregisterValidator
  }) => {
    const { maxLength, required } = settings;
    const error = useInputValidator(
      (v) => {
        if (required && !v) return `${name} is required`;
        if (maxLength && maxLength !== 0 && v?.length > maxLength) {
          return `${name} has a maximum length of ${maxLength}`;
        }
        return null;
      },
      registerValidator,
      unregisterValidator
    );

    return (
      <Textarea label={name} description={description} required={required}
        maxLength={maxLength > 1 ? maxLength : null} value={value || ''}
        onChange={(e) => onChange(e.target.value)} error={error} autosize />
    );
  }
};

export default input;
