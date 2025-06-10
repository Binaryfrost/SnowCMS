import { Checkbox } from '@mantine/core';
import { Input } from '../InputRegistry';

const input: Input<boolean> = {
  id: 'checkbox',
  name: 'Checkbox',

  deserialize: (data) => data === 'true',
  serialize: (data) => data.toString(),

  renderInput: ({ name, description, value, onChange }) => {
    return (
      <Checkbox label={name} description={description} checked={value}
        onChange={(e) => onChange(e.currentTarget.checked)} />
    );
  },

  renderHtml: (value) => value
};

export default input;
