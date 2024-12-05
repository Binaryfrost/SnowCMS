import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Alert, JsonInput } from '@mantine/core';
import { Plugin } from '../../src';

const plugin: Plugin = {
  name: 'test-plugin',
  hooks: {
    serverStart: ({ logger, port }) => {
      logger.log(`Server started on port ${port}`);
    },
    setup: ({ logger, addInput }) => {
      logger.log('Registering input');

      /*
       * If you need to run some code only on the server (e.g. reading a config file
       * with sensitive information), you can do it this way. Don't import any
       * server-side code as this may leak the config file. Use fs instead.
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
    },
    // TODO: Test
    beforeWebsiteCreateHook: ({ logger, website }) => {
      logger.log('before website create', website);

      // This should prevent the creation of the website
      if (website.name.includes('reject')) throw new Error('Invalid website name');
    },
    afterWebsiteCreateHook: ({ logger, website }) => {
      logger.log('before website create', website);

      // This should result in a warning in console but not stop the website creation
      if (website.name.includes('reject')) throw new Error('Invalid website name');
    }
  }
};

export default plugin;
