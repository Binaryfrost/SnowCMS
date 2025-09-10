import { Checkbox } from '@mantine/core';
import { Input } from '../InputRegistry';
import ExpressError from '../ExpressError';

const input: Input<boolean> = {
  id: 'checkbox',
  name: 'Checkbox',

  deserialize: (data) => data === 'true',
  serialize: (data) => data.toString(),

  renderInput: ({ name, description, value, required, onChange }) => {
    return (
      <Checkbox label={name} description={description} checked={value || false}
        onChange={(e) => onChange(e.currentTarget.checked)} required={required} />
    );
  },

  renderHtml: (value) => value
};

export default input;
