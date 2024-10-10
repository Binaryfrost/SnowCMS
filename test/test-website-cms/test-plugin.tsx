import { forwardRef, useImperativeHandle, useRef } from 'react';
import { JsonInput } from '@mantine/core';
import { Plugin } from '../../src';

const plugin: Plugin = {
  name: 'test-plugin',
  hooks: {
    start: ({ logger, addInput, registerRoute }) => {
      logger.log('Started');

      registerRoute('/plugin-registered-route/1').get((req, res) => {
        res.end('OK');
      });

      registerRoute('/plugin-registered-route/2', 'ADMIN').get((req, res) => {
        res.end('Restricted route');
      });

      addInput<string>({
        id: 'test-plugin-json',
        name: 'Test Plugin JSON',

        serialize: (data) => data,
        deserialize: (data) => data,

        renderInput: () => forwardRef((props, ref) => {
          const valueRef = useRef<string>(props.value || '');

          useImperativeHandle(ref, () => ({
            getValues: () => valueRef.current
          }));

          return (
            <JsonInput label={props.name} description={props.description}
              defaultValue={props.value} onChange={(e) => valueRef.current = e} />
          );
        }),

        renderHtml: (value) => value
      });
    }
  }
};

export default plugin;
