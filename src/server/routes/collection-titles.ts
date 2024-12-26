import express from 'express';
import { db } from '../database/db';
import handleAccessControl from '../handleAccessControl';
import { exists } from '../database/util';
import { CollectionTitle } from '../../common/types/CollectionTitle';
import { asyncRouteFix } from '../util';
import { callHook } from '../plugins/hooks';
import ExpressError from '../../common/ExpressError';

const router = express.Router({ mergeParams: true });

router.get('/', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId } = req.params;

  handleAccessControl(res, req.user, 'VIEWER', websiteId);

  if (!(await exists('collections', collectionId))) {
    throw new ExpressError('Collection not found', 404);
  }

  const title = await db<CollectionTitle>()
    .select('collectionId', 'inputId')
    .from('collection_titles')
    .where({
      collectionId
    })
    .first();

  res.json(title || {
    collectionId,
    inputId: null
  });
}));

router.put('/', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId } = req.params;

  handleAccessControl(res, req.user, 'SUPERUSER', websiteId);

  if (!(await exists('collections', collectionId))) {
    throw new ExpressError('Collection not found', 404);
  }

  const { inputId } = req.body;

  if (!inputId) {
    throw new ExpressError('Title is required');
  }

  const collectionTitle: CollectionTitle = {
    collectionId,
    inputId
  };

  callHook('beforeCollectionTitleModifyHook', {
    collectionTitle
  });

  await db<CollectionTitle>()
    .insert(collectionTitle)
    .into('collection_titles')
    .onConflict('collectionId')
    .merge();

  res.json({
    message: 'Collection Title updated'
  });

  callHook('afterCollectionTitleModifyHook', {
    collectionTitle
  });
}));

export default router;
