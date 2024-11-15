import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Alert, JsonInput } from '@mantine/core';
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

      /*
       * If you need to run some code only on the server (e.g. reading a config file
       * with sensitive information), you can do it this way
       */
      if (typeof window !== 'undefined') {
        logger.log('Client-side');
      } else {
        logger.log('Server-side');
      }

      addInput<string>({
        id: 'test-plugin-json',
        name: 'Test Plugin JSON',
        description: 'A plugin-added input that adds a JSON input to the Input Registry.',

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

        isAllowed: (website, collection) => (
          (
            website.name.toLowerCase().includes('test') ||
            collection.name.toLowerCase().includes('test')
          ) && !collection.name.toLowerCase().includes('features')
        ),

        renderHtml: (value) => value
      });

      addInput<null>({
        id: 'test-plugin-alert',
        name: 'Test Plugin Alert',
        description: 'An plugin-added alert with non-configurable content',

        serialize: () => '',
        deserialize: () => null,

        renderInput: () => function Component() {
          return (
            <Alert>Test Plugin Alert</Alert>
          );
        },

        renderHtml: () => null
      });
    }
  }
};

export default plugin;
