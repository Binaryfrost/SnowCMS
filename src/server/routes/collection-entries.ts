import express, { type Response } from 'express';
import { v7 as uuid } from 'uuid';
import { db } from '../database/db';
import { handleAccessControl } from '../../common/users';
import { exists, getCollectionInputs } from '../database/util';
import { CollectionEntry, CollectionEntryInputs } from '../../common/types/CollectionEntry';
import { CollectionInput } from '../../common/types/CollectionInputs';
import InputRegistry from '../../common/InputRegistry';

const router = express.Router({ mergeParams: true });

function renderInput(input: string, data: string) {
  const registryInput = InputRegistry.getInput(input);
  if (registryInput) {
    return registryInput.renderHtml(registryInput.deserialize(data));
  }

  return null;
}

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

  const renderedTitles = {};
  const titles = await db()
    .select('data', 'input', 'entryId')
    .from('collection_titles')
    .innerJoin('collection_entry_inputs', 'collection_titles.inputId', 'collection_entry_inputs.inputId')
    .innerJoin('collection_inputs', 'collection_inputs.id', 'collection_entry_inputs.inputId')
    .where('collection_titles.collectionId', collectionId);

  for (const title of titles) {
    const renderedTitle = renderInput(title.input, title.data);
    renderedTitles[title.entryId] = renderedTitle || undefined;
  }

  const entries = await db()<CollectionEntry>('collection_entries')
    .select('id', 'collectionId', 'createdAt', 'updatedAt')
    .where({
      collectionId
    });

  res.json(entries.map((entry) => ({
    ...entry,
    title: renderedTitles[entry.id] || null
  })));
});

router.get('/:id', async (req, res) => {
  // @ts-expect-error
  const { websiteId, collectionId, id } = req.params;
  const { render } = req.query;

  if (!handleAccessControl(res, req.user, 'VIEWER', websiteId)) return;

  const entry = await db()<CollectionEntry>('collection_entries')
    .select('id', 'collectionId', 'createdAt', 'updatedAt')
    .where({
      id
    }).first();

  if (!entry) {
    res.status(404).json({
      error: 'Collection Entry not found'
    });
    return;
  }

  const inputs = await db()<CollectionEntryInputs>('collection_entry_inputs')
    .select('inputId', 'entryId', 'data')
    .where({
      entryId: id
    });

  const collectionInputs = (await getCollectionInputs(collectionId)).reduce((a, c) => ({
    ...a,
    [c.id]: c
  }), {});

  const inputsData = render && render !== 'false' ? inputs.reduce((a, c) => ({
    ...a,
    [collectionInputs[c.inputId].fieldName]: renderInput(collectionInputs[c.inputId].input, c.data)
  }), {}) : inputs;

  res.json({
    ...entry,
    data: inputsData
  });
});

async function addOrUpdate(data: Record<string, string>, collectionId: string,
  entryId: string, res: Response) {
  const collectionInputs: Record<string, CollectionInput> =
    (await getCollectionInputs(collectionId)).reduce((a, c) => ({
      ...a,
      [c.fieldName]: c
    }), {});

  const updates = [];
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (!(key in collectionInputs)) {
        res.status(400).json({
          error: `Invalid data: Input ${key} does not exist on this Collection`
        });
        return false;
      }

      updates.push({
        inputId: collectionInputs[key].id,
        data: data[key]
      });
    }
  }

  console.log(data, collectionInputs);

  await db().transaction(async (trx) => {
    // TODO: Try-catch all database operations
    await trx<CollectionEntry>('collection_entries')
      .insert({
        id: entryId,
        collectionId,
        createdAt: Math.round(Date.now() / 1000),
        updatedAt: Math.round(Date.now() / 1000)
      })
      .onConflict('id')
      .merge(['updatedAt']);

    const updatesWithId = updates.map((update) => ({
      ...update,
      entryId
    }));

    console.log(updatesWithId);

    await trx<CollectionEntryInputs>('collection_entry_inputs')
      .insert(updatesWithId)
      .onConflict('inputId')
      .merge();
  });

  return true;
}

router.post('/', async (req, res) => {
  // @ts-expect-error
  const { websiteId, collectionId } = req.params;

  if (!handleAccessControl(res, req.user, 'USER', websiteId)) return;

  if (!(await exists('collections', collectionId))) {
    res.status(404).json({
      error: 'Collection not found'
    });
    return;
  }

  const entryId = uuid();
  if (!await addOrUpdate(req.body, collectionId, entryId, res)) return;

  res.status(200).json({
    message: 'Collection Entry created',
    id: entryId
  });
});

router.patch('/:id', async (req, res) => {
  // @ts-expect-error
  const { websiteId, collectionId, id } = req.params;

  if (!handleAccessControl(res, req.user, 'USER', websiteId)) return;

  if (!(await exists('collection_entries', id))) {
    res.status(404).json({
      error: 'Collection Entry not found'
    });
    return;
  }

  if (!await addOrUpdate(req.body, collectionId, id, res)) return;

  res.status(200).json({
    message: 'Collection Entry edited'
  });
});

router.delete('/:id', async (req, res) => {
  // @ts-expect-error
  const { websiteId, id } = req.params;

  if (!handleAccessControl(res, req.user, 'USER', websiteId)) return;

  if (!(await exists('collection_entries', id))) {
    res.status(404).json({
      error: 'Collection Entry not found'
    });
    return;
  }

  await db().transaction(async (trx) => {
    await trx<CollectionEntryInputs>('collection_entry_inputs')
      .where({
        entryId: id
      })
      .delete();

    await trx<CollectionEntry>('collection_entries')
      .where({
        id
      })
      .delete();
  });

  res.json({
    message: 'Collection Entry deleted'
  });
});

export default router;
