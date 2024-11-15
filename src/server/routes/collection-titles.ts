import express from 'express';
import { db } from '../database/db';
import { handleAccessControl } from '../../common/users';
import { exists } from '../database/util';
import { CollectionTitle } from '../../common/types/CollectionTitle';

const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
  // @ts-expect-error
  const { websiteId, collectionId } = req.params;

  if (!handleAccessControl(res, req.user, 'VIEWER', websiteId)) return;

  if (!(await exists('collections', collectionId))) {
    res.status(404).json({
      error: 'Collection not found'
    });
    return;
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
});

router.put('/', async (req, res) => {
  // @ts-expect-error
  const { websiteId, collectionId } = req.params;

  if (!handleAccessControl(res, req.user, 'SUPERUSER', websiteId)) return;

  if (!(await exists('collections', collectionId))) {
    res.status(404).json({
      error: 'Collection not found'
    });
    return;
  }

  const { inputId } = req.body;

  await db<CollectionTitle>()
    .insert({
      collectionId,
      inputId
    })
    .into('collection_titles')
    .onConflict('collectionId')
    .merge();

  res.json({
    message: 'Collection Title updated'
  });
});

export default router;
