import { randomBytes } from 'crypto';
import express from 'express';
import bcrypt from 'bcrypt';
import { db } from '../database/db';
import { asyncRouteFix } from '../util';
import ExpressError from '../../common/ExpressError';
import { DatabaseUser, LoginConfig } from '../../common/types/User';
import { getConfig } from '../config/config';
import { redis } from '../database/redis';

const router = express.Router();

router.post('/', asyncRouteFix(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ExpressError('Email and password are required');
  }

  console.log(email, password);

  const user = await db()<DatabaseUser>('users')
    .select('id', 'email', 'password', 'role', 'active')
    .where({
      email
    })
    .first();

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ExpressError('Email or password incorrect');
  }

  const token = `${user.id}:${randomBytes(32).toString('base64url')}`;
  console.log(token);

  await redis().set(`session:${token}`, user.id, {
    EX: 86400
  });

  res.json({
    token
  });
}));

router.get('/config', asyncRouteFix(async (req, res) => {
  const { sso } = getConfig();

  const loginConfig: LoginConfig = {
    sso: {
      enabled: !!sso,
      forced: sso?.forceSso || false
    }
  };

  res.json(loginConfig);
}));

export default router;
