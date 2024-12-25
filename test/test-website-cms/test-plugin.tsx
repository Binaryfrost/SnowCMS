import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Alert, JsonInput } from '@mantine/core';
import { Plugin, WebsiteHookCallReasons, ExpressError } from '../../src';

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
    beforeWebsiteCreateHook: ({ logger, website }) => {
      logger.log('before website create', website);

      // This should prevent the creation of the website
      if (website.name.includes('reject')) throw new ExpressError('Invalid website name', 400);
    },
    afterWebsiteCreateHook: ({ logger, website }) => {
      logger.log('before website create', website);

      // This should result in a warning in console but not stop the website creation
      if (website.name.includes('test')) throw new ExpressError('Invalid website name', 400);
    },
    beforeWebsiteModifyHook: ({ logger, website }) => {
      logger.log('website modified', website);
    },
    beforeWebsiteDeleteHook: ({ website }) => {
      if (website.name === 'Test Website') throw new ExpressError('That website cannot be deleted', 403);
    },
    afterWebsiteDeleteHook: ({ logger, website }) => {
      logger.log('website deleted', website);
    },
    afterCollectionEntryModifyHook: ({ logger, collectionEntry }) => {
      logger.log('collection entry modified', collectionEntry);
    },
    beforeCollectionEntryDeleteHook: ({ logger, collectionEntry }) => {
      if (collectionEntry.collectionId === '0192c4a8-9d0b-7ee9-a0b6-b87e38003c06') {
        throw new ExpressError('Entries in this collection cannot be deleted', 403);
      }

      logger.log('will delete entry', collectionEntry);
    },
    afterCollectionEntryDeleteHook: ({ logger, collectionEntry }) => {
      logger.log('deleted entry', collectionEntry);
    },
    beforeMediaCreateHook: ({ media }) => {
      if (media.fileType === 'application/zip' || media.fileType === 'application/x-zip-compressed') {
        throw new ExpressError('ZIP files are not allowed', 400);
      }
    },
    afterMediaConfirmHook: ({ logger, media }) => {
      logger.log('media uploaded', media.url);
    },
    beforeWebsiteHookCalled: ({ logger, website, collection, reason, cancel }) => {
      if (collection.id === '0192c4a8-9d0b-7ee9-a0b6-b87e38003c06' &&
        reason.reason === WebsiteHookCallReasons.COLLECTION_ENTRY_CREATED) {
        cancel();
      }

      if (website.hook.includes('example')) {
        cancel();
      }

      logger.log('before website hook called', website, collection, reason);
    }
  }
};

export default plugin;
