import express, { type Request } from 'express';
import { v7 as uuid } from 'uuid';
import { db } from '../database/db';
import handleAccessControl from '../handleAccessControl';
import { exists, getCollection, getCollectionInputs, getWebsite } from '../database/util';
import InputRegistry from '../../common/InputRegistry';
import { asyncRouteFix, paginate, pagination } from '../util';
import ExpressError from '../../common/ExpressError';
import { callHook } from '../plugins/hooks';
import type { PaginatedResponse } from '../../common/types/PaginatedResponse';
import { CollectionEntry, CollectionEntryDraft, CollectionEntryDraftSummary, CollectionEntryDraftWithData } from '../../common/types/CollectionEntry';
import { data } from 'autoprefixer';

const router = express.Router({ mergeParams: true });

router.get('/', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId } = req.params;
  handleAccessControl(req.user, 'VIEWER', websiteId);

  const { entry, search } = req.query as { entry?: string, search?: string };
  const searchQuery = search ? `%${search}%` : undefined;

  const inputs = await getCollectionInputs(collectionId);
  const collection = await getCollection(collectionId);
  const titleInput = inputs.filter((input) => input.id === collection.title)[0] || null;

  const query = db()<CollectionEntryDraft>('collection_entry_drafts')
    .select('id', 'entryId', 'createdAt', 'updatedAt', 'data')
    .where({
      collectionId
    });

  if (entry) {
    query.andWhere({
      entryId: entry
    });
  }

  if (searchQuery) {
    query.andWhere((builder) => {
      builder.whereILike('id', searchQuery);

      if (titleInput) {
        builder.orWhereRaw(
          'LOWER(JSON_UNQUOTE(JSON_EXTRACT(data, ?))) LIKE LOWER(?)',
          [`$.${titleInput.fieldName}`, searchQuery]
        );
      }
    });
  }

  const p = await pagination(req, query);
  const drafts: CollectionEntryDraft[] = await paginate(query, p);

  const response: PaginatedResponse<CollectionEntryDraftSummary> = {
    page: p.page,
    pages: p.pages,
    data: drafts.map(({ data, ...draft }) => ({
      ...draft,
      title: data[titleInput.fieldName]
    }))
  };

  res.json(response);
}));

router.post('/', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId } = req.params;
  handleAccessControl(req.user, 'USER', websiteId);

  const existingEntry = req.query.entry as string;
  const inputs = (await getCollectionInputs(collectionId)).map((input) => input.fieldName);
  const data = req.body;

  if (!Object.keys(data).every((d) => inputs.includes(d))) {
    throw new ExpressError('One or more properties do not reference a Collection Input\'s field name');
  }

  if (existingEntry) {
    const entryExists = await db()<CollectionEntry>('collection_entries')
      .select('id')
      .where({
        id: existingEntry
      })
      .first();

    if (!entryExists) {
      throw new ExpressError('Collection Entry with that ID not found');
    }
  }

  const timestamp = Math.round(Date.now() / 1000);

  const payload: CollectionEntryDraft = {
    id: uuid(),
    entryId: existingEntry || null,
    collectionId,
    createdAt: timestamp,
    updatedAt: timestamp,
    data
  };

  callHook('beforeCollectionEntryDraftCreateHook', {
    collectionEntryDraft: payload
  });

  await db()<CollectionEntryDraft>('collection_entry_drafts')
    .insert(payload);

  res.json({
    message: 'Draft created',
    id: payload.id
  });

  callHook('afterCollectionEntryDraftCreateHook', {
    collectionEntryDraft: payload
  });
}));

router.get('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId, id } = req.params;
  handleAccessControl(req.user, 'VIEWER', websiteId);

  const inputs = await getCollectionInputs(collectionId);
  const draft = await db()<CollectionEntryDraft>('collection_entry_drafts')
    .select('id', 'entryId', 'createdAt', 'updatedAt', 'data')
    .where({
      id
    })
    .first();

  if (!draft) {
    throw new ExpressError('Draft not found', 404);
  }

  const response: CollectionEntryDraftWithData = {
    ...draft,
    collectionId,
    data: inputs.map((input) => ({
      inputId: input.id,
      data: draft.data[input.fieldName] || null
    }))
  };

  res.json(response);
}));

router.put('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId, id } = req.params;
  handleAccessControl(req.user, 'USER', websiteId);

  const inputs = (await getCollectionInputs(collectionId)).map((input) => input.fieldName);
  const data = req.body;

  if (!Object.keys(data).every((d) => inputs.includes(d))) {
    throw new ExpressError('One or more properties do not reference a Collection Input\'s field name');
  }

  const existingDraft = await db()<CollectionEntryDraft>('collection_entry_drafts')
    .select('id', 'entryId', 'collectionId', 'createdAt')
    .where({
      id
    })
    .first();

  if (!existingDraft) {
    throw new ExpressError('Collection Entry with that ID not found');
  }

  const payload: CollectionEntryDraft = {
    ...existingDraft,
    updatedAt: Math.round(Date.now() / 1000),
    data
  };

  callHook('beforeCollectionEntryDraftModifyHook', {
    collectionEntryDraft: payload
  });

  await db()<CollectionEntryDraft>('collection_entry_drafts')
    .update({
      ...payload,
      // @ts-ignore
      data: JSON.stringify(payload.data)
    })
    .where({
      id
    });

  res.json({
    message: 'Draft edited',
    id: payload.id
  });

  callHook('afterCollectionEntryDraftModifyHook', {
    collectionEntryDraft: payload
  });
}));

router.delete('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, collectionId, id } = req.params;
  handleAccessControl(req.user, 'USER', websiteId);

  if (!(await exists('collection_entry_drafts', id))) {
    throw new ExpressError('Draft not found', 404);
  }

  const existingDraft = await db()<CollectionEntryDraft>('collection_entry_drafts')
    .where({
      id
    })
    .first();

  await callHook('beforeCollectionEntryDraftDeleteHook', {
    collectionEntryDraft: existingDraft
  });  

  await db()<CollectionEntryDraft>('collection_entry_drafts')
    .where({
      id
    })
    .delete();

  res.json({
    message: 'Draft deleted'
  });

  await callHook('afterCollectionEntryDraftDeleteHook', {
    collectionEntryDraft: existingDraft
  });
}));

export default router;
