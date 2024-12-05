import express, { type Response, type Request } from 'express';
import { v7 as uuid } from 'uuid';
import { db } from '../database/db';
import { handleAccessControl } from '../../common/users';
import { exists, getCollection, getCollectionInputs, getWebsite, reorderCollectionInputs } from '../database/util';
import { CollectionInput, DatabaseCollectionInput } from '../../common/types/CollectionInputs';
import InputRegistry from '../../common/InputRegistry';
import { CollectionTitle } from '../../common/types/CollectionTitle';
import { asyncRouteFix } from '../util';
import { CollectionEntryInputs } from '../../common/types/CollectionEntry';

const router = express.Router({ mergeParams: true });

router.get('/', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId } = req.params;

  if (!handleAccessControl(res, req.user, 'VIEWER', websiteId)) return;

  if (!(await exists('collections', collectionId))) {
    res.status(404).json({
      error: 'Collection not found'
    });
    return;
  }

  res.json(await getCollectionInputs(collectionId));
}));

async function isInputAllowed(input: string, req: Request, res: Response) {
  const { websiteId, collectionId } = req.params;

  const registryInput = InputRegistry.getInput(input);
  if (!registryInput) {
    res.status(400).json({
      error: 'Provided Input does not exist in Input Registry'
    });

    return false;
  }

  const website = await getWebsite(websiteId);
  const collection = await getCollection(collectionId);

  if ('isAllowed' in registryInput && !registryInput.isAllowed(website, collection)) {
    res.status(403).json({
      error: 'Website or collection does not have permission to use Input'
    });
    return false;
  }

  return true;
}

router.post('/', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId } = req.params;

  if (!handleAccessControl(res, req.user, 'SUPERUSER', websiteId)) return;

  if (!(await exists('collections', collectionId))) {
    res.status(404).json({
      error: 'Collection not found'
    });
    return;
  }

  const lastRecordOrder = (
    (
      await db<DatabaseCollectionInput>()
        .first('order')
        .from('collection_inputs')
        .where({
          collectionId
        })
        .orderBy('order', 'desc')
        .limit(1)
    )?.order
  ) ?? -1;

  const { name, description, fieldName, input, inputConfig } = req.body;

  if (!name || !fieldName || !input) {
    res.status(400).json({
      error: 'Name, field name, and input required'
    });
    return;
  }

  if (!await isInputAllowed(input, req, res)) return;

  const id = uuid();
  await db<DatabaseCollectionInput>()
    .insert({
      id,
      collectionId,
      name,
      description,
      fieldName,
      input,
      inputConfig,
      order: lastRecordOrder + 1
    })
    .into('collection_inputs');

  res.json({
    message: 'Collection Input created',
    id
  });
}));

router.put('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, id } = req.params;

  if (!handleAccessControl(res, req.user, 'SUPERUSER', websiteId)) return;

  if (!(await exists('collection_inputs', id))) {
    res.status(404).json({
      error: 'Collection Input not found'
    });
    return;
  }

  const { name, description, fieldName, input, inputConfig } = req.body;

  if (!name || !fieldName || !input) {
    res.status(400).json({
      error: 'Name, field name, and input required'
    });
    return;
  }

  if (!await isInputAllowed(input, req, res)) return;

  await db<DatabaseCollectionInput>()
    .table('collection_inputs')
    .update({
      name,
      description,
      fieldName,
      input,
      inputConfig
    })
    .where({
      id
    });

  res.json({
    message: 'Collection Input edited',
  });
}));

router.patch('/:id/order', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId, id } = req.params;

  if (!handleAccessControl(res, req.user, 'SUPERUSER', websiteId)) return;

  if (!(await exists('collection_inputs', id))) {
    res.status(404).json({
      error: 'Collection Input not found'
    });
    return;
  }

  const { order } = req.body;

  if (Number.isNaN(parseInt(order, 10))) {
    res.status(400).json({
      error: 'Order is required and must be a number'
    });
    return;
  }

  await reorderCollectionInputs(req.params.id, collectionId, order);

  res.json({
    message: `Moved input to position ${order}`
  });
}));

router.delete('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId, id } = req.params;

  if (!handleAccessControl(res, req.user, 'SUPERUSER', websiteId)) return;

  if (!(await exists('collection_inputs', id))) {
    res.status(404).json({
      error: 'Collection Input not found'
    });
    return;
  }

  await db().transaction(async (trx) => {
    const { order } = await trx<DatabaseCollectionInput>('collection_inputs')
      .select('order')
      .where({
        id
      })
      .first();

    await trx<DatabaseCollectionInput>('collection_inputs')
      .decrement('order', 1)
      .where({
        collectionId
      })
      .andWhere('order', '>', order);

    await trx<CollectionTitle>('collection_titles')
      .where({
        inputId: id
      })
      .delete();

    await trx<CollectionEntryInputs>('collection_entry_inputs')
      .where({
        inputId: id
      })
      .delete();

    await trx<CollectionInput>('collection_inputs')
      .where({
        id
      })
      .delete();
  });

  res.json({
    message: 'Collection Input deleted'
  });
}));

export default router;
