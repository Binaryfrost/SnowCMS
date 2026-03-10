import express from 'express';
import { asyncRouteFix } from '../util';
import handleAccessControl from '../handleAccessControl';
import { isSafeUrl } from '../ssrf';
import { ExpressError } from '../../lib';

const router = express.Router({ mergeParams: true });

router.post('/ssrf/check-url', asyncRouteFix(async (req, res) => {
  handleAccessControl(req.user, 'VIEWER');

  const { url } = req.body;
  if (!url) throw new ExpressError('URL is required');
  res.json(await isSafeUrl(url));
}));

export default router;