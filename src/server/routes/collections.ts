import express from 'express';
import { v7 as uuid } from 'uuid';
import { db } from '../database/db';
import { type Collection } from '../../common/types/Collection';
import { handleAccessControl } from '../../common/users';
import { exists } from '../database/util';

const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
  // @ts-expect-error
  const { websiteId } = req.params;

  if (!handleAccessControl(res, req.user, 'VIEWER', websiteId)) return;

  if (!(await exists('websites', websiteId))) {
    res.status(404).json({
      error: 'Website not found'
    });
    return;
  }

  res.json(await db<Collection>()
    .select('id', 'websiteId', 'name')
    .from('collections')
    .where({
      websiteId
    }));
});

router.post('/', async (req, res) => {
  // @ts-expect-error
  const { websiteId } = req.params;

  if (!handleAccessControl(res, req.user, 'SUPERUSER', websiteId)) return;

  const { name } = req.body;

  if (!name) {
    res.status(400).json({
      error: 'Name is required'
    });
    return;
  }

  if (!(await exists('websites', websiteId))) {
    res.status(404).json({
      error: 'Website not found'
    });
    return;
  }

  await db<Collection>().insert({
    id: uuid(),
    websiteId,
    name
  }).into('collections');

  res.json({
    message: 'Collection created'
  });
});

export default router;
