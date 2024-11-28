import express from 'express';
import { v7 as uuid } from 'uuid';
import { db } from '../database/db';
import { type Collection } from '../../common/types/Collection';
import { handleAccessControl } from '../../common/users';
import { exists } from '../database/util';
import { asyncRouteFix } from '../util';

const router = express.Router({ mergeParams: true });

router.get('/', asyncRouteFix(async (req, res) => {
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
}));

router.post('/', asyncRouteFix(async (req, res) => {
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

  const id = uuid();

  await db<Collection>().insert({
    id,
    websiteId,
    name
  }).into('collections');

  res.json({
    message: 'Collection created',
    id
  });
}));

router.get('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, id } = req.params;

  if (!handleAccessControl(res, req.user, 'VIEWER', websiteId)) return;

  const collection = await db()<Collection>('collections')
    .select('id', 'websiteId', 'name')
    .where({
      id
    })
    .first();

  if (!collection) {
    res.status(404).json({
      error: 'Collection not found'
    });

    return;
  }

  res.json(collection);
}));

router.put('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, id } = req.params;

  if (!handleAccessControl(res, req.user, 'SUPERUSER', websiteId)) return;

  const { name } = req.body;
  if (!name) {
    res.status(400).json({
      error: 'Name is required'
    });
    return;
  }

  if (!(await exists('collections', id))) {
    res.status(404).json({
      error: 'Collection not found'
    });

    return;
  }

  await db()<Collection>('collections')
    .where({
      id
    })
    .update({
      name
    });

  res.json({
    message: 'Collection edited'
  });
}));

router.delete('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, id } = req.params;

  if (!handleAccessControl(res, req.user, 'SUPERUSER', websiteId)) return;

  if (!(await exists('collections', id))) {
    res.status(404).json({
      error: 'Collection not found'
    });

    return;
  }

  await db()<Collection>('collections')
    .where({
      id
    })
    .delete();

  res.json({
    message: 'Collection deleted'
  });
}));

export default router;
