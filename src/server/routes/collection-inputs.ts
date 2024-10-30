import express from 'express';
import { v7 as uuid } from 'uuid';
import { db } from '../database/db';
import { handleAccessControl } from '../../common/users';
import { exists } from '../database/util';
import { CollectionInput } from '../../common/types/CollectionInputs';

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

  res.json(await db<CollectionInput>()
    .select('id', 'collectionId', 'name', 'description', 'fieldName', 'input', 'inputConfig')
    .from('collection_inputs')
    .where({
      collectionId
    }));
});

router.post('/', async (req, res) => {
  // @ts-expect-error
  const { websiteId } = req.params;

  if (!handleAccessControl(res, req.user, 'SUPERUSER', websiteId)) return;

  res.status(400).json({
    error: 'Not implemented yet'
  });
});

export default router;
