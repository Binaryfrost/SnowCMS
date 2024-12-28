import express from 'express';
import { v7 as uuid } from 'uuid';
import { db } from '../database/db';
import { type Collection } from '../../common/types/Collection';
import handleAccessControl from '../handleAccessControl';
import { exists } from '../database/util';
import { asyncRouteFix } from '../util';
import { callHook } from '../plugins/hooks';
import ExpressError from '../../common/ExpressError';

const router = express.Router({ mergeParams: true });

router.get('/', asyncRouteFix(async (req, res) => {
  const { websiteId } = req.params;

  handleAccessControl(req.user, 'VIEWER', websiteId);

  if (!(await exists('websites', websiteId))) {
    throw new ExpressError('Website not found', 404);
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

  handleAccessControl(req.user, 'SUPERUSER', websiteId);

  const { name } = req.body;

  if (!name) {
    throw new ExpressError('Name is required');
  }

  if (!(await exists('websites', websiteId))) {
    throw new ExpressError('Website not found', 404);
  }

  const id = uuid();
  const collection: Collection = {
    id,
    websiteId,
    name
  };

  callHook('beforeCollectionCreateHook', {
    collection
  });

  await db<Collection>().insert(collection).into('collections');

  res.json({
    message: 'Collection created',
    id
  });

  callHook('afterCollectionCreateHook', {
    collection
  });
}));

router.get('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, id } = req.params;

  handleAccessControl(req.user, 'VIEWER', websiteId);

  const collection = await db()<Collection>('collections')
    .select('id', 'websiteId', 'name')
    .where({
      id
    })
    .first();

  if (!collection) {
    throw new ExpressError('Collection not found', 404);
  }

  res.json(collection);
}));

router.put('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, id } = req.params;

  handleAccessControl(req.user, 'SUPERUSER', websiteId);

  const { name } = req.body;
  if (!name) {
    throw new ExpressError('Name is required', 404);
  }

  if (!(await exists('collections', id))) {
    throw new ExpressError('Collection not found', 404);
  }

  const collection: Collection = {
    id,
    websiteId,
    name
  };

  callHook('beforeCollectionModifyHook', {
    collection
  });

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

  callHook('afterCollectionModifyHook', {
    collection
  });
}));

export async function deleteCollection(id: string) {
  await db().transaction(async (trx) => {
    await trx('collection_entry_inputs')
      .innerJoin('collection_inputs', 'collection_inputs.id', 'collection_entry_inputs.inputId')
      .where({
        collectionId: id
      })
      .delete();

    await trx('collection_entries')
      .where({
        collectionId: id
      })
      .delete();

    await trx('collection_titles')
      .where({
        collectionId: id
      })
      .delete();

    await trx('collection_inputs')
      .where({
        collectionId: id
      })
      .delete();

    await trx('collections')
      .where({
        id
      })
      .delete();
  });
}

router.delete('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, id } = req.params;

  handleAccessControl(req.user, 'SUPERUSER', websiteId);

  if (!(await exists('collections', id))) {
    throw new ExpressError('Collection not found', 404);
  }

  const collection = await db()<Collection>('collections')
    .select('id', 'name', 'websiteId')
    .where({
      id
    })
    .first();

  callHook('beforeCollectionDeleteHook', {
    collection
  });

  await deleteCollection(id);

  res.json({
    message: 'Collection deleted'
  });

  callHook('afterCollectionDeleteHook', {
    collection
  });
}));

export default router;
