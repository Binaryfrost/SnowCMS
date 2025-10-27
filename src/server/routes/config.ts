import express from 'express';
import { asyncRouteFix, getTimezones } from '../util';
import handleAccessControl from '../handleAccessControl';

const router = express.Router({ mergeParams: true });

router.get('/timezones', asyncRouteFix(async (req, res) => {
  handleAccessControl(req.user, 'VIEWER');
  
  res.json(getTimezones());
}));

export default router;