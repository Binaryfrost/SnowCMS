import express from 'express';
import { v7 as uuid } from 'uuid';
import { db } from '../database/db';
import { type Website } from '../../common/types/Website';
import { handleAccessControl } from '../../common/users';
import { exists } from '../database/util';
import { asyncRouteFix } from '../util';

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

router.delete('/:id', asyncRouteFix(async (req, res) => {
  if (!handleAccessControl(res, req.user, 'ADMIN')) return;

  if (!(await exists('websites', req.params.id))) {
    res.status(404).json({
      error: 'Website not found'
    });

    return;
  }

  // TODO: Delete Collections, Collection Entries, and Media

  await db()<Website>('websites')
    .where({
      id: req.params.id
    })
    .delete();

  res.json({
    message: 'Website deleted'
  });
}));

export default router;
