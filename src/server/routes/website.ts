import express from 'express';
import { v7 as uuid } from 'uuid';
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { db } from '../database/db';
import { type Website } from '../../common/types/Website';
import { handleAccessControl } from '../../common/users';
import { exists } from '../database/util';
import { asyncRouteFix } from '../util';
import { Collection } from '../../common/types/Collection';
import { getConfig } from '../config/config';
import { deleteCollection } from './collections';

const router = express.Router();

router.get('/', asyncRouteFix(async (req, res) => {
  if (!handleAccessControl(res, req.user, 'VIEWER')) return;

  // TODO: Filter based on access
  res.json(await db<Website>().select('id', 'name', 'hook').from('websites'));
}));

router.post('/', asyncRouteFix(async (req, res) => {
  if (!handleAccessControl(res, req.user, 'ADMIN')) return;

  const { name, hook } = req.body;
  if (!name) {
    res.status(400).json({
      error: 'Name is required'
    });
    return;
  }

  const id = uuid();

  await db<Website>().insert({
    id,
    name,
    hook
  }).into('websites');

  res.json({
    message: 'Website created',
    id
  });
}));

router.get('/:id', asyncRouteFix(async (req, res) => {
  if (!handleAccessControl(res, req.user, 'VIEWER', req.params.id)) return;

  const website = await db()<Website>('websites')
    .select('id', 'name', 'hook')
    .where({
      id: req.params.id
    })
    .first();

  if (!website) {
    res.status(404).json({
      error: 'Website not found'
    });

    return;
  }

  res.json(website);
}));

router.put('/:id', asyncRouteFix(async (req, res) => {
  if (!handleAccessControl(res, req.user, 'SUPERUSER', req.params.id)) return;

  const { name, hook } = req.body;
  if (!name) {
    res.status(400).json({
      error: 'Name is required'
    });
    return;
  }

  if (!(await exists('websites', req.params.id))) {
    res.status(404).json({
      error: 'Website not found'
    });

    return;
  }

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
}));

// https://www.codemzy.com/blog/delete-s3-folder-nodejs
async function deleteFolder(location: string) {
  const { s3 } = getConfig().media;
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
    console.log(list);
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

  if (!handleAccessControl(res, req.user, 'ADMIN')) return;

  if (!(await exists('websites', id))) {
    res.status(404).json({
      error: 'Website not found'
    });

    return;
  }

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
}));

export default router;
