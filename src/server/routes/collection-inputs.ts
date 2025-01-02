import express, { type Request } from 'express';
import { v7 as uuid } from 'uuid';
import { db } from '../database/db';
import handleAccessControl from '../handleAccessControl';
import { exists, getCollection, getCollectionInputs, getWebsite, reorderCollectionInputs } from '../database/util';
import { CollectionInput, DatabaseCollectionInput } from '../../common/types/CollectionInputs';
import InputRegistry from '../../common/InputRegistry';
import { CollectionTitle } from '../../common/types/CollectionTitle';
import { asyncRouteFix } from '../util';
import { CollectionEntryInputs } from '../../common/types/CollectionEntry';
import { WebsiteHookCallReasons, WebsiteHookCallTargets, callHook, callHttpHook } from '../plugins/hooks';
import ExpressError from '../../common/ExpressError';

const router = express.Router({ mergeParams: true });

router.get('/', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId } = req.params;

  handleAccessControl(req.user, 'VIEWER', websiteId);

  if (!(await exists('collections', collectionId))) {
    throw new ExpressError('Collection not found', 404);
  }

  res.json(await getCollectionInputs(collectionId));
}));

async function checkIfInputAllowed(input: string, inputConfig: string, req: Request) {
  const { websiteId, collectionId } = req.params;

  const registryInput = InputRegistry.getInput(input);
  if (!registryInput) {
    throw new ExpressError('Provided Input does not exist in Input Registry');
  }

  const website = await getWebsite(websiteId);
  const collection = await getCollection(collectionId);

  if ('isAllowed' in registryInput && !registryInput.isAllowed(website, collection)) {
    throw new ExpressError('Website or collection does not have permission to use Input', 403);
  }

  if ('deserializeSettings' in registryInput) {
    await registryInput.validateSettings?.(inputConfig, registryInput.deserializeSettings, req);
  }
}

router.post('/', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId } = req.params;

  handleAccessControl(req.user, 'SUPERUSER', websiteId);

  if (!(await exists('collections', collectionId))) {
    throw new ExpressError('Collection not found', 404);
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
    throw new ExpressError('Name, field name, and input required');
  }

  await checkIfInputAllowed(input, inputConfig, req);

  const id = uuid();
  const collectionInput: CollectionInput = {
    id,
    collectionId,
    name,
    description,
    fieldName,
    input,
    inputConfig
  };

  await callHook('beforeCollectionInputCreateHook', {
    collectionInput
  });

  await db<DatabaseCollectionInput>()
    .insert({
      ...collectionInput,
      order: lastRecordOrder + 1
    })
    .into('collection_inputs');

  res.json({
    message: 'Collection Input created',
    id
  });

  await callHook('afterCollectionInputCreateHook', {
    collectionInput
  });
}));

router.put('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId, id } = req.params;

  handleAccessControl(req.user, 'SUPERUSER', websiteId);

  if (!(await exists('collection_inputs', id))) {
    throw new ExpressError('Collection Input not found', 404);
  }

  const { name, description, fieldName, input, inputConfig } = req.body;

  if (!name || !fieldName || !input) {
    throw new ExpressError('Name, field name, and input required');
  }

  await checkIfInputAllowed(input, inputConfig, req);

  const collectionInput: CollectionInput = {
    id,
    collectionId,
    name,
    description,
    fieldName,
    input,
    inputConfig
  };

  await callHook('beforeCollectionInputModifyHook', {
    collectionInput
  });

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

  await callHook('afterCollectionInputModifyHook', {
    collectionInput
  });

  callHttpHook(await getWebsite(websiteId), await getCollection(collectionId), {
    reason: WebsiteHookCallReasons.COLLETION_INPUT_MODIFIED,
    target: {
      id,
      type: WebsiteHookCallTargets.COLLECTION_INPUT
    }
  });
}));

router.patch('/:id/order', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId, id } = req.params;

  handleAccessControl(req.user, 'SUPERUSER', websiteId);

  if (!(await exists('collection_inputs', id))) {
    throw new ExpressError('Collection Input not found', 404);
  }

  const { order } = req.body;

  if (Number.isNaN(parseInt(order, 10))) {
    throw new ExpressError('Order is required and must be a number');
  }

  await reorderCollectionInputs(req.params.id, collectionId, order);

  res.json({
    message: `Moved input to position ${order}`
  });
}));

router.delete('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId, id } = req.params;

  handleAccessControl(req.user, 'SUPERUSER', websiteId);

  if (!(await exists('collection_inputs', id))) {
    throw new ExpressError('Collection Input not found', 404);
  }

  const collectionInput = await db()<CollectionInput>('collection_inputs')
    .select('id', 'collectionId', 'name', 'description', 'fieldName', 'input', 'inputConfig')
    .where({
      id
    })
    .first();

  await callHook('beforeCollectionInputDeleteHook', {
    collectionInput
  });

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

  await callHook('afterCollectionInputDeleteHook', {
    collectionInput
  });

  callHttpHook(await getWebsite(websiteId), await getCollection(collectionId), {
    reason: WebsiteHookCallReasons.COLLECTION_INPUT_DELETED,
    target: {
      id,
      type: WebsiteHookCallTargets.COLLECTION_INPUT
    }
  });
}));

export default router;
