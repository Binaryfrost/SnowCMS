import { defineHookPlugin } from '../../../../src/config';
import { ExpressError } from '../../../../src/lib';
import { WebsiteHookCallReasons } from '../../../../src/lib/server';

export default defineHookPlugin({
  name: 'test-hooks',
  plugin: ({ logger }) => ({
    serverStart: ({ port }) => {
      logger.log(`Server started on port ${port}`);
    },
    beforeWebsiteCreateHook: ({ website }) => {
      logger.log('before website create', website);

      // This should prevent the creation of the website
      if (website.name.includes('reject')) throw new ExpressError('Invalid website name', 400);
    },
    afterWebsiteCreateHook: ({ website }) => {
      logger.log('before website create', website);

      // This should result in a warning in console but not stop the website creation
      if (website.name.includes('test')) throw new ExpressError('Invalid website name', 400);
    },
    beforeWebsiteModifyHook: ({ website }) => {
      logger.log('website modified', website);
    },
    beforeWebsiteDeleteHook: ({ website }) => {
      if (website.name === 'Test Website') throw new ExpressError('That website cannot be deleted', 403);
    },
    afterWebsiteDeleteHook: ({ website }) => {
      logger.log('website deleted', website);
    },
    beforeCollectionEntryModifyHook: ({ collectionEntry }) => {
      const containsProfanity = collectionEntry.data.some((e) => e.data?.includes('profanity'));
      if (containsProfanity) {
        throw new ExpressError('Collection Entry contains profanity');
      }
    },
    afterCollectionEntryModifyHook: ({ collectionEntry }) => {
      logger.log('collection entry modified', collectionEntry);
    },
    beforeCollectionEntryDeleteHook: ({ collectionEntry }) => {
      if (collectionEntry.collectionId === '0192c4a8-9d0b-7ee9-a0b6-b87e38003c06') {
        throw new ExpressError('Entries in this collection cannot be deleted', 403);
      }

      logger.log('will delete entry', collectionEntry);
    },
    afterCollectionEntryDeleteHook: ({ collectionEntry }) => {
      logger.log('deleted entry', collectionEntry);
    },
    beforeMediaCreateHook: ({ media }) => {
      if (media.fileType === 'application/zip' || media.fileType === 'application/x-zip-compressed') {
        throw new ExpressError('ZIP files are not allowed', 400);
      }
    },
    afterMediaConfirmHook: ({ media }) => {
      logger.log('media uploaded', media.url);
    },
    beforeWebsiteHookCalled: ({ website, collection, reason, cancel }) => {
      if (collection.id === '0192c4a8-9d0b-7ee9-a0b6-b87e38003c06' &&
        reason.reason === WebsiteHookCallReasons.COLLECTION_ENTRY_CREATED) {
        cancel();
        return;
      }

      logger.log('before website hook called', website, collection, reason);

      if (website.hook.includes('example')) {
        cancel();
      }
    }
  })
});
