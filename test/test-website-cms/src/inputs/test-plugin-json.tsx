import { forwardRef, useImperativeHandle, useRef } from 'react';
import { JsonInput } from '@mantine/core';
import { defineInputPlugin } from '../../../../src/config';

export default defineInputPlugin<string>({
  name: 'test-plugin-json',
  plugin: ({ logger }) => {
    logger.log('Test Plugin JSON');

    return {
      id: 'test-plugin-json',
      name: 'Test Plugin JSON',
      description: 'A plugin-added input that adds a JSON input to the Input Registry.',

      serialize: (data) => data,
      deserialize: (data) => data,

      renderInput: ({
        name, description, value, onChange
      }) => {
        return (
          <JsonInput label={name} description={description}
            value={value} onChange={(e) => onChange(e)} />
        );
      },

      isAllowed: (website, collection) => (
        (
          website.name.toLowerCase().includes('test') ||
          collection.name.toLowerCase().includes('test')
        ) && !collection.name.toLowerCase().includes('features')
      ),

      renderHtml: (value) => value
    };
  }
});
