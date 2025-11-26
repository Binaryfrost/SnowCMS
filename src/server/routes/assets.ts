import express from 'express';
import { asyncRouteFix } from '../util';
import { getManifest } from '../manifest';
import { getConfig } from '../config/config';

const router = express.Router({ mergeParams: true });

router.get('/email-logo', asyncRouteFix(async (req, res) => {
  const { instanceRootUrl } = getConfig();
  const manifest = await getManifest();
  const logo = manifest['logo.png'];
  
  res.redirect(302, __SNOWCMS_CLIENT_PUBLIC_PATH__ ? logo : new URL(logo, instanceRootUrl).href);
}));

export default router;