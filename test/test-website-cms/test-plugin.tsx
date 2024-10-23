import { forwardRef, useImperativeHandle, useRef } from 'react';
import { JsonInput } from '@mantine/core';
import { Plugin } from '../../src';

const plugin: Plugin = {
  name: 'test-plugin',
  hooks: {
    serverSetup: ({ logger, registerRoute }) => {
      logger.log('Registering routes');

      registerRoute('/plugin-registered-route/1').get((req, res) => {
        res.end('OK');
      });

      registerRoute('/plugin-registered-route/2', 'ADMIN').get((req, res) => {
        res.end('Restricted route');
      });
    },
    serverStart: ({ logger, port }) => {
      logger.log(`Server started on port ${port}`);
    },
    setup: ({ logger, addInput }) => {
      logger.log('Registering input');

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
