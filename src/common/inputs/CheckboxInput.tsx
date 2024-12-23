import { forwardRef, useImperativeHandle, useState } from 'react';
import { Checkbox } from '@mantine/core';
import { Input } from '../InputRegistry';

const input: Input<boolean> = {
  id: 'checkbox',
  name: 'Checkbox',

  deserialize: (data) => data === 'true',
  serialize: (data) => data.toString(),

  renderInput: () => forwardRef((props, ref) => {
    const [checked, setChecked] = useState(props.value || false);

    useImperativeHandle(ref, () => ({
      getValues: () => checked
    }));

    return (
      <Checkbox label={props.name} description={props.description} checked={checked}
        onChange={(e) => setChecked(e.currentTarget.checked)} />
    );
  }),

  renderHtml: (value) => value
};

export default input;
