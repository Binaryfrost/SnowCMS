import express, { type Request } from 'express';
import { v7 as uuid } from 'uuid';
import { db } from '../database/db';
import { handleAccessControl } from '../../common/users';
import { exists, getCollection, getCollectionInputs, getWebsite } from '../database/util';
import { CollectionEntry, CollectionEntryInputs, CollectionEntryWithData } from '../../common/types/CollectionEntry';
import { CollectionInput } from '../../common/types/CollectionInputs';
import InputRegistry from '../../common/InputRegistry';
import { asyncRouteFix } from '../util';
import ExpressError from '../../common/ExpressError';
import { WebsiteHookCallReasons, WebsiteHookCallTargets, callHook, callHttpHook } from '../../common/plugins';

const router = express.Router({ mergeParams: true });

async function renderInput(input: string, data: string, settings: string, req: Request) {
  const registryInput = InputRegistry.getInput(input);
  if (registryInput) {
    return registryInput.renderHtml(
      registryInput.deserialize(data),
      settings && 'deserializeSettings' in registryInput ?
        registryInput.deserializeSettings(settings) : null,
      req
    );
  }

  return null;
}

async function checkInputValueValidity(input: string, data: string,
  settings: string, req: Request) {
  const registryInput = InputRegistry.getInput(input);
  return registryInput?.validate?.(
    data,
    registryInput.deserialize,
    settings ? registryInput.deserializeSettings?.(settings) : null,
    req
  );
}

router.get('/', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId } = req.params;

  handleAccessControl(res, req.user, 'VIEWER', websiteId);

  if (!(await exists('collections', collectionId))) {
    throw new ExpressError('Collection not found', 404);
  }

  const renderedTitles = {};
  const titles = await db()
    .select('data', 'input', 'entryId', 'inputConfig')
    .from('collection_titles')
    .innerJoin('collection_entry_inputs', 'collection_titles.inputId', 'collection_entry_inputs.inputId')
    .innerJoin('collection_inputs', 'collection_inputs.id', 'collection_entry_inputs.inputId')
    .where('collection_titles.collectionId', collectionId);

  for await (const title of titles) {
    const renderedTitle = await renderInput(title.input, title.data, title.inputConfig, req);
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
}));

router.get('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId, id } = req.params;
  const { render } = req.query;

  handleAccessControl(res, req.user, 'VIEWER', websiteId);

  const entry = await db()<CollectionEntry>('collection_entries')
    .select('id', 'collectionId', 'createdAt', 'updatedAt')
    .where({
      id
    }).first();

  if (!entry) {
    throw new ExpressError('Collection Entry not found', 404);
  }

  const inputs =
    (await db()<CollectionEntryInputs>('collection_entry_inputs')
      .select('inputId', 'entryId', 'data')
      .where({
        entryId: id
      }));

  let inputsData = {};

  if (render && render !== 'false') {
    const renderedInputs: (() => Promise<{name: string, data: Promise<any>}>)[] = [];
    const keyedInputs = inputs.reduce((a, c) => ({
      ...a,
      [c.inputId]: c
    }), {});

    interface CollectionInputWithData extends CollectionInput {
      data: string
    }

    const collectionInputs: Record<string, CollectionInputWithData> =
      (await getCollectionInputs(collectionId))
        .reduce((a, c) => ({
          ...a,
          [c.id]: {
            ...c,
            data: keyedInputs[c.id]?.data || null
          }
        }), {});

    for (const collectionInput in collectionInputs) {
      if (Object.prototype.hasOwnProperty.call(collectionInputs, collectionInput)) {
        const element = collectionInputs[collectionInput];
        renderedInputs.push(async () => ({
          name: element.fieldName,
          data: await renderInput(element.input, element.data, element.inputConfig, req)
        }));
      }
    }

    inputsData = (await Promise.all(renderedInputs.map((promise) => promise())))
      .reduce((a, c) => ({
        ...a,
        [c.name]: c.data
      }), {});
  } else {
    inputsData = inputs;
  }

  res.json({
    ...entry,
    data: inputsData
  });
}));

async function prepareData(data: Record<string, string>, collectionId: string,
  entryId: string, req: Request): Promise<CollectionEntryWithData> {
  const collectionInputs: Record<string, CollectionInput> =
    (await getCollectionInputs(collectionId)).reduce((a, c) => ({
      ...a,
      [c.fieldName]: c
    }), {});

  const updates = [];
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (!(key in collectionInputs)) {
        throw new ExpressError(`Invalid data: Input ${key} does not exist on this Collection`, 400);
      }

      const collectionInput = collectionInputs[key];
      // eslint-disable-next-line no-await-in-loop
      await checkInputValueValidity(
        collectionInput.input,
        data[key],
        collectionInput.inputConfig,
        req
      );

      updates.push({
        inputId: collectionInputs[key].id,
        data: data[key]
      });
    }
  }

  const updatesWithId: CollectionEntryInputs[] = updates.map((update) => ({
    ...update,
    entryId
  }));

  const existingEntry = await db()<CollectionEntry>('collection_entries')
    .where({
      id: entryId
    })
    .first();

  return {
    id: entryId,
    collectionId,
    createdAt: existingEntry?.createdAt || Math.round(Date.now() / 1000),
    updatedAt: Math.round(Date.now() / 1000),
    data: updatesWithId
  };
}

async function addOrUpdate(data: CollectionEntryWithData) {
  await db().transaction(async (trx) => {
    await trx<CollectionEntry>('collection_entries')
      .insert({
        id: data.id,
        collectionId: data.collectionId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      })
      .onConflict('id')
      .merge(['updatedAt']);

    await trx<CollectionEntryInputs>('collection_entry_inputs')
      .insert(data.data)
      .onConflict('inputId')
      .merge();
  });

  return true;
}

router.post('/', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId } = req.params;

  handleAccessControl(res, req.user, 'USER', websiteId);

  if (!(await exists('collections', collectionId))) {
    throw new ExpressError('Collection not found', 404);
  }

  const entryId = uuid();
  const collectionEntry = await prepareData(req.body, collectionId, entryId, req);

  callHook('beforeCollectionEntryCreateHook', {
    collectionEntry
  });

  if (!await addOrUpdate(collectionEntry)) return;

  res.json({
    message: 'Collection Entry created',
    id: entryId
  });

  callHook('afterCollectionEntryCreateHook', {
    collectionEntry
  });

  callHttpHook(await getWebsite(websiteId), await getCollection(collectionId), {
    reason: WebsiteHookCallReasons.COLLECTION_ENTRY_CREATED,
    target: {
      id: entryId,
      type: WebsiteHookCallTargets.COLLECTION_ENTRY
    }
  });
}));

router.patch('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId, id } = req.params;

  handleAccessControl(res, req.user, 'USER', websiteId);

  if (!(await exists('collection_entries', id))) {
    throw new ExpressError('Collection Entry not found', 404);
  }

  const collectionEntry = await prepareData(req.body, collectionId, id, req);

  callHook('beforeCollectionEntryModifyHook', {
    collectionEntry
  });

  if (!await addOrUpdate(collectionEntry)) return;

  res.json({
    message: 'Collection Entry edited'
  });

  callHook('afterCollectionEntryModifyHook', {
    collectionEntry
  });

  callHttpHook(await getWebsite(websiteId), await getCollection(collectionId), {
    reason: WebsiteHookCallReasons.COLLECTION_ENTRY_MODIFIED,
    target: {
      id,
      type: WebsiteHookCallTargets.COLLECTION_ENTRY
    }
  });
}));

router.delete('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId, id } = req.params;

  handleAccessControl(res, req.user, 'USER', websiteId);

  if (!(await exists('collection_entries', id))) {
    throw new ExpressError('Collection Entry not found', 404);
  }

  const existingEntry = await db()<CollectionEntry>('collection_entries')
    .where({
      id
    })
    .first();

  const collectionEntry = {
    id,
    collectionId,
    createdAt: existingEntry?.createdAt || Math.round(Date.now() / 1000),
    updatedAt: Math.round(Date.now() / 1000),
    data: await db()<CollectionEntryInputs>('collection_entry_inputs')
      .where({
        entryId: id
      })
  };

  callHook('beforeCollectionEntryDeleteHook', {
    collectionEntry
  });

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

  callHook('afterCollectionEntryDeleteHook', {
    collectionEntry
  });

  callHttpHook(await getWebsite(websiteId), await getCollection(collectionId), {
    reason: WebsiteHookCallReasons.COLLECTION_ENTRY_DELETED,
    target: {
      id,
      type: WebsiteHookCallTargets.COLLECTION_ENTRY
    }
  });
}));

export default router;
