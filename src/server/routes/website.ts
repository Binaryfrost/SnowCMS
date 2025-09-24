import express from 'express';
import { v7 as uuid } from 'uuid';
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import type { Knex } from 'knex';
import { db } from '../database/db';
import { type Website } from '../../common/types/Website';
import handleAccessControl from '../handleAccessControl';
import { exists } from '../database/util';
import { asyncRouteFix, paginate, pagination } from '../util';
import { Collection } from '../../common/types/Collection';
import { getConfig } from '../config/config';
import { deleteCollection } from './collections';
import { callHook } from '../plugins/hooks';
import ExpressError from '../../common/ExpressError';
import { ApiKeyWebsite, UserWebsite } from '../../common/types/User';
import { PaginatedResponse } from '../../common/types/PaginatedResponse';

const router = express.Router();

router.get('/', asyncRouteFix(async (req, res) => {
  handleAccessControl(req.user, 'VIEWER');

  const where = (builder: Knex.QueryBuilder) => {
    if (req.user.role !== 'ADMIN') {
      builder.whereIn('id', req.user.websites);
    }
  };
  const p = await pagination(req, 'websites', where);

  const websites = await paginate(
    db()<Website>('websites')
      .select('id', 'name', 'hook')
      .where(where),
    p
  );

  const response: PaginatedResponse<Website> = {
    data: websites,
    page: p.page,
    pages: p.pages
  };

  res.json(response);
}));

router.post('/', asyncRouteFix(async (req, res) => {
  handleAccessControl(req.user, 'ADMIN');

  const { name, hook } = req.body;
  if (!name) {
    throw new ExpressError('Name is required');
  }

  const id = uuid();
  const website: Website = {
    id,
    name,
    hook
  };

  await callHook('beforeWebsiteCreateHook', {
    website
  });

  await db<Website>().insert(website).into('websites');

  res.json({
    message: 'Website created',
    id
  });

  await callHook('afterWebsiteCreateHook', {
    website
  });
}));

router.get('/:id', asyncRouteFix(async (req, res) => {
  handleAccessControl(req.user, 'VIEWER', req.params.id);

  const website = await db()<Website>('websites')
    .select('id', 'name', 'hook')
    .where({
      id: req.params.id
    })
    .first();

  if (!website) {
    throw new ExpressError('Website not found', 404);
  }

  res.json(website);
}));

router.put('/:id', asyncRouteFix(async (req, res) => {
  handleAccessControl(req.user, 'SUPERUSER', req.params.id);

  const { name, hook } = req.body;
  if (!name) {
    throw new ExpressError('Name is required');
  }

  if (!(await exists('websites', req.params.id))) {
    throw new ExpressError('Website not found', 404);
  }

  const website: Website = {
    id: req.params.id,
    name,
    hook
  };

  await callHook('beforeWebsiteModifyHook', {
    website
  });

  await db()<Website>('websites')
    .where({
      id: req.params.id
    })
    .update({
      name,
      hook
    });

  res.json({
    message: 'Website edited'
  });

  await callHook('afterWebsiteModifyHook', {
    website
  });
}));

// https://www.codemzy.com/blog/delete-s3-folder-nodejs
async function deleteFolder(location: string) {
  const { media } = getConfig();
  if (!media) return;

  const { s3 } = media;
  const client = new S3Client({
    credentials: {
      accessKeyId: s3.accessKeyId,
      secretAccessKey: s3.secretAccessKey
    },
    region: s3.region,
    endpoint: s3.endpoint
  });

  async function recursiveDelete(token?: string) {
    const listCommand = new ListObjectsV2Command({
      Bucket: s3.bucket,
      Prefix: location,
      ContinuationToken: token
    });

    const list = await client.send(listCommand);
    if (list.KeyCount) {
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: s3.bucket,
        Delete: {
          Objects: list.Contents.map((item) => ({ Key: item.Key })),
          Quiet: false
        },
      });

      const deleted = await client.send(deleteCommand);
      if (deleted.Errors) {
        deleted.Errors.map((error) => console.log(`${error.Key} could not ` +
          `be deleted - ${error.Code}`));
      }
    }

    if (list.NextContinuationToken) {
      recursiveDelete(list.NextContinuationToken);
    }
  }

  return recursiveDelete();
}

router.delete('/:id', asyncRouteFix(async (req, res) => {
  const { id } = req.params;

  handleAccessControl(req.user, 'ADMIN');

  if (!(await exists('websites', id))) {
    throw new ExpressError('Website not found', 404);
  }

  const website = await db()<Website>('websites')
    .select('id', 'name', 'hook')
    .where({
      id
    })
    .first();

  await callHook('beforeWebsiteDeleteHook', {
    website
  });

  await db().transaction(async (trx) => {
    const collections = await trx<Collection>('collections')
      .where({
        websiteId: id
      });

    for await (const collection of collections) {
      await deleteCollection(collection.id);
    }

    await trx('media')
      .where({
        websiteId: id
      })
      .delete();

    await trx<UserWebsite>('user_websites')
      .where({
        websiteId: id
      })
      .delete();

    await trx<ApiKeyWebsite>('apikey_websites')
      .where({
        websiteId: id
      })
      .delete();

    await trx('websites')
      .where({
        id
      })
      .delete();
  });

  await deleteFolder(`media/${id}/`);

  res.json({
    message: 'Website deleted'
  });

  await callHook('afterWebsiteDeleteHook', {
    website
  });
}));

export default router;
