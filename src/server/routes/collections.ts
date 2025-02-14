import express from 'express';
import { v7 as uuid } from 'uuid';
import { db } from '../database/db';
import { type Collection } from '../../common/types/Collection';
import handleAccessControl from '../handleAccessControl';
import { exists } from '../database/util';
import { asyncRouteFix, paginate, pagination } from '../util';
import { callHook } from '../plugins/hooks';
import ExpressError from '../../common/ExpressError';
import { PaginatedResponse } from '../../common/types/PaginatedResponse';

const router = express.Router({ mergeParams: true });

function handleBooleanConversion(collection: Collection): Collection {
  return {
    ...collection,
    callHook: !!collection.callHook
  };
}

router.get('/', asyncRouteFix(async (req, res) => {
  const { websiteId } = req.params;

  handleAccessControl(req.user, 'VIEWER', websiteId);

  if (!(await exists('websites', websiteId))) {
    throw new ExpressError('Website not found', 404);
  }

  const where = {
    websiteId
  };
  const p = await pagination(req, 'collections', where);

  const collections = await paginate(
    db<Collection>()
      .select('id', 'websiteId', 'name', 'callHook')
      .from('collections')
      .where(where),
    p
  );

  const response: PaginatedResponse<Collection> = {
    data: collections.map(handleBooleanConversion),
    page: p.page,
    pages: p.pages
  };

  res.json(response);
}));

router.post('/', asyncRouteFix(async (req, res) => {
  const { websiteId } = req.params;

  handleAccessControl(req.user, 'SUPERUSER', websiteId);

  const { name, callHook: ch } = req.body;

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
    name,
    callHook: ch || false,
    title: null,
    slug: null
  };

  await callHook('beforeCollectionCreateHook', {
    collection
  });

  await db<Collection>().insert(collection).into('collections');

  res.json({
    message: 'Collection created',
    id
  });

  await callHook('afterCollectionCreateHook', {
    collection
  });
}));

router.get('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, id } = req.params;

  handleAccessControl(req.user, 'VIEWER', websiteId);

  const collection = await db()<Collection>('collections')
    .select('id', 'websiteId', 'name', 'callHook', 'title', 'slug')
    .where({
      id
    })
    .first();

  if (!collection) {
    throw new ExpressError('Collection not found', 404);
  }

  res.json(handleBooleanConversion(collection));
}));

router.put('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, id } = req.params;

  handleAccessControl(req.user, 'SUPERUSER', websiteId);

  const { name, callHook: ch, title, slug } = req.body;
  if (!name || !title) {
    throw new ExpressError('Name and title are required', 404);
  }

  if (!(await exists('collections', id))) {
    throw new ExpressError('Collection not found', 404);
  }

  const collection: Collection = handleBooleanConversion({
    id,
    websiteId,
    name,
    callHook: ch || false,
    title,
    slug
  });

  await callHook('beforeCollectionModifyHook', {
    collection
  });

  await db()<Collection>('collections')
    .where({
      id
    })
    .update({
      name,
      callHook: collection.callHook,
      title,
      slug: slug || null
    });

  res.json({
    message: 'Collection edited'
  });

  await callHook('afterCollectionModifyHook', {
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

    await trx('collections')
      .update({
        title: null,
        slug: null
      })
      .where({
        id
      });

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
    .select('id', 'name', 'websiteId', 'callHook', 'title', 'slug')
    .where({
      id
    })
    .first();

  await callHook('beforeCollectionDeleteHook', {
    collection
  });

  await deleteCollection(id);

  res.json({
    message: 'Collection deleted'
  });

  await callHook('afterCollectionDeleteHook', {
    collection
  });
}));

export default router;
