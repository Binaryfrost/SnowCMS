import express, { type Request } from 'express';
import { v7 as uuid } from 'uuid';
import { db } from '../database/db';
import handleAccessControl from '../handleAccessControl';
import { exists, getCollection, getCollectionInputs, getWebsite } from '../database/util';
import { CollectionEntry, CollectionEntryInputs, CollectionEntryWithData, CollectionEntryWithTitle } from '../../common/types/CollectionEntry';
import { CollectionInput } from '../../common/types/CollectionInputs';
import InputRegistry from '../../common/InputRegistry';
import { asyncRouteFix, paginate, pagination } from '../util';
import ExpressError from '../../common/ExpressError';
import { WebsiteHookCallReasons, WebsiteHookCallTargets, callHook, callHttpHook } from '../plugins/hooks';
import { PaginatedResponse } from '../../common/types/PaginatedResponse';

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
  const { search } = req.query;

  handleAccessControl(req.user, 'VIEWER', websiteId);

  if (!(await exists('collections', collectionId))) {
    throw new ExpressError('Collection not found', 404);
  }

  const searchQuery = search ? `%${search}%` : undefined;
  const query = (withSelect: boolean) => {
    const q = db()
      .from('collection_entries')
      .innerJoin(
        'collections',
        'collection_entries.collectionId',
        'collections.id'
      )
      .having((builder) => {
        if (searchQuery) {
          builder.whereILike('collection_entries.id', searchQuery);
          builder.orWhereILike('title', searchQuery);
        }
      })
      .andWhere('collection_entries.collectionId', collectionId);

    const titleSelect = () => db().select('data')
      .from('collection_entry_inputs')
      .whereRaw('`collection_entry_inputs`.`entryId` = `collection_entries`.`id`')
      .andWhereRaw('`collections`.`title` IS NOT NULL')
      .andWhereRaw('`collection_entry_inputs`.`inputId` = `collections`.`title`')
      .as('title');

    const slugSelect = () => db().select('data')
      .from('collection_entry_inputs')
      .whereRaw('`collection_entry_inputs`.`entryId` = `collection_entries`.`id`')
      .andWhereRaw('`collections`.`slug` IS NOT NULL')
      .andWhereRaw('`collection_entry_inputs`.`inputId` = `collections`.`slug`')
      .as('slug');

    return withSelect ? q.select(
      'collection_entries.id',
      'collection_entries.collectionId',
      'createdAt',
      'updatedAt',
      titleSelect(),
      slugSelect()
    ) : q.select('collection_entries.id', titleSelect(), slugSelect());
  };

  const p = await pagination(req, query(false));

  const entries = await paginate(
    query(true),
    p,
    'collection_entries.id'
  );

  const response: PaginatedResponse<CollectionEntryWithTitle> = {
    data: entries,
    page: p.page,
    pages: p.pages
  };

  res.json(response);
}));

async function getCollectionEntry(id: string, req: Request) {
  const { collectionId } = req.params;
  const { render } = req.query;

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

  return {
    ...entry,
    data: inputsData
  };
}

router.get('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, id } = req.params;

  handleAccessControl(req.user, 'VIEWER', websiteId);

  res.json(await getCollectionEntry(id, req));
}));

router.get('/slug/*', asyncRouteFix(async (req, res) => {
  const { collectionId } = req.params;
  const slug = req.params[0];

  const { slug: slugInput } = await getCollection(collectionId);

  if (!slugInput) {
    throw new ExpressError('Accessing entries using a slug is not configured for this Collection');
  }

  const entry = await db()<CollectionEntryInputs>('collection_entry_inputs')
    .select('entryId')
    .where({
      inputId: slugInput,
      data: slug
    })
    .first();

  if (!entry) {
    throw new ExpressError('Collection Entry not found');
  }

  res.json(await getCollectionEntry(entry.entryId, req));
}));

async function prepareData(data: Record<string, string>, collectionId: string,
  entryId: string, req: Request): Promise<CollectionEntryWithData> {
  const { slug } = await getCollection(collectionId);

  const collectionInputs: Record<string, CollectionInput> =
    (await getCollectionInputs(collectionId)).reduce((a, c) => ({
      ...a,
      [c.fieldName]: c
    }), {});

  const updates = [];
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (!(key in collectionInputs)) {
        throw new ExpressError(`Invalid data: Input ${key} does not exist on this Collection`);
      }

      const collectionInput = collectionInputs[key];
      // eslint-disable-next-line no-await-in-loop
      await checkInputValueValidity(
        collectionInput.input,
        data[key],
        collectionInput.inputConfig,
        req
      );

      if (slug && slug === collectionInputs[key].id && data[key]) {
        // eslint-disable-next-line no-await-in-loop
        const duplicateSlug = await db()<CollectionEntryInputs>('collection_entry_inputs')
          .where({
            inputId: slug,
            data: data[key]
          })
          .andWhereNot({
            entryId
          })
          .first();

        if (duplicateSlug) {
          throw new ExpressError('An Entry with that slug already exists');
        }
      }

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

  handleAccessControl(req.user, 'USER', websiteId);

  if (!(await exists('collections', collectionId))) {
    throw new ExpressError('Collection not found', 404);
  }

  const entryId = uuid();
  const collectionEntry = await prepareData(req.body, collectionId, entryId, req);

  await callHook('beforeCollectionEntryCreateHook', {
    collectionEntry
  });

  if (!await addOrUpdate(collectionEntry)) return;

  res.json({
    message: 'Collection Entry created',
    id: entryId
  });

  await callHook('afterCollectionEntryCreateHook', {
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

  handleAccessControl(req.user, 'USER', websiteId);

  if (!(await exists('collection_entries', id))) {
    throw new ExpressError('Collection Entry not found', 404);
  }

  const collectionEntry = await prepareData(req.body, collectionId, id, req);

  await callHook('beforeCollectionEntryModifyHook', {
    collectionEntry
  });

  if (!await addOrUpdate(collectionEntry)) return;

  res.json({
    message: 'Collection Entry edited'
  });

  await callHook('afterCollectionEntryModifyHook', {
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

  handleAccessControl(req.user, 'USER', websiteId);

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

  await callHook('beforeCollectionEntryDeleteHook', {
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

  await callHook('afterCollectionEntryDeleteHook', {
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
