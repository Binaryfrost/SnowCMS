import express, { type Request } from 'express';
import { v7 as uuid } from 'uuid';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type { Optional } from 'utility-types';
import { db } from '../database/db';
import { ROLE_HIERARCHY, handleAccessControl } from '../../common/users';
import { exists, getUserFromDatabase, handleUserBooleanConversion } from '../database/util';
import { asyncRouteFix } from '../util';
import ExpressError from '../../common/ExpressError';
import { ApiKey, ApiKeyWebsite, ApiKeyWithWebsites, DatabaseApiKey, DatabaseUser,
  User, UserWebsite, UserWithWebsites } from '../../common/types/User';

const router = express.Router();

/*
 * TODO: Write code for accounts and auth
 *
 * All accounts are stored in MySQL tables:
 * - users: Contains user ID, email, password hash, role, active state
 * - user_websites: One-to-many relationship between user ID and website ID
 *
 * API keys should use the following tables:
 * - apikey: Contains API key, user ID (reference) and role
 * - apikey_websites: One-to-many relationship between API key and website ID
 *
 * Sessions will be stored in Redis with the following key format: `session:{userId}:{sessionId}`.
 * The value should simply be the user ID to simplify getting data from the Redis cache
 * or MySQL. Doing so allows all of a user's sessions to be invalidated when they change their
 * password. However, the user's current session should stay active
 * (unless they didn't change their own password).
 *
 * Because the user permissions and role is required for every request, that information should be
 * cached in Redis for 10 minutes with the key format `user:{userId}`. Whenever any changes are
 * made to the user data, the data should be removed from the Redis cache. This ensures that the
 * data is cached, but also always up to date.
 * For API keys, the key format `apikey:{apikey}` should be used.
 *
 * The format of the token in the authorization head depends on the type of token:
 * - User token: `{userId}:{sessionId}`
 * - API token: `apikey:{apikey}`
 *
 */

type DatabaseUserWithWebsites = DatabaseUser & UserWithWebsites;

router.get('/', asyncRouteFix(async (req, res) => {
  handleAccessControl(res, req.user, 'ADMIN');

  const users = await db()<User>('users').select('id', 'email', 'role', 'active');
  const userWebsites = await db()<UserWebsite>('user_websites').select('userId', 'websiteId');

  res.json(
    users
      .map((u) => ({
        ...u,
        websites: userWebsites.filter((w) => w.userId === u.id).map((w) => w.websiteId)
      }))
      .map(handleUserBooleanConversion)
  );
}));

async function addOrUpdateUser(user: DatabaseUser) {
  if (!user.email.includes('@')) {
    throw new ExpressError('Invalid email');
  }

  if (!(user.role in ROLE_HIERARCHY)) {
    throw new ExpressError('Invalid role');
  }

  await db().transaction(async (trx) => {
    const usersWithThatEmail = await trx<User>('users')
      .where({
        email: user.email
      })
      .select('id')
      .first();

    if (usersWithThatEmail && usersWithThatEmail.id !== user.id) {
      throw new ExpressError('User with that email address already exists');
    }

    await trx<User>('users')
      .insert({
        id: user.id,
        email: user.email,
        role: user.role,
        active: user.active
      })
      .onConflict('id')
      .merge();

    if (user.password) {
      await trx<DatabaseUser>('users')
        .update({
          password: await bcrypt.hash(user.password, 10)
        })
        .where({
          id: user.id
        });
    }
  });
}

async function addOrUpdateUserWebsites(userId: string, websites: string[]) {
  if (!Array.isArray(websites)) {
    throw new ExpressError('Websites must be an array');
  }

  await db().transaction(async (trx) => {
    const currentWebsites = await trx<UserWebsite>('user_websites')
      .select('websiteId')
      .where({
        userId
      });

    const websitesToAdd = websites.filter((w) => !currentWebsites.some((v) => v.websiteId === w));
    const websitesToRemove = currentWebsites.filter((w) => !websites.includes(w.websiteId));

    if (websitesToAdd.length > 0) {
      await trx<UserWebsite>('user_websites')
        .insert(websitesToAdd.map((e) => ({
          userId,
          websiteId: e
        })));
    }

    if (websitesToRemove.length > 0) {
      await trx<UserWebsite>('user_websites')
        .whereIn(
          ['userId', 'websiteId'],
          websitesToRemove.map((w) => [userId, w.websiteId])
        )
        .delete();
    }
  });
}

router.post('/', asyncRouteFix(async (req, res) => {
  handleAccessControl(res, req.user, 'ADMIN');

  const { email, password, role, active, websites }: DatabaseUserWithWebsites = req.body;

  if (!email || !password || !role || !websites) {
    throw new ExpressError('All fields are required');
  }

  const id = uuid();

  await addOrUpdateUser({
    id,
    email,
    password,
    role,
    active: active ?? false
  });

  await addOrUpdateUserWebsites(id, websites);

  res.json({
    id,
    message: 'Created account'
  });
}));

function handleUserAccessControl(user: User, userId: string) {
  if (!user) {
    throw new ExpressError('Unauthorized', 401);
  }

  if (user.role === 'ADMIN') return;

  if (user.id !== userId) {
    throw new ExpressError('Forbidden', 403);
  }
}

async function ensureUserExists(userId) {
  if (!(await exists('users', userId))) {
    throw new ExpressError('User does not exist', 404);
  }
}

router.get('/me', asyncRouteFix(async (req, res) => {
  if (!req.user) {
    throw new ExpressError('Unauthorized', 401);
  }

  res.json(req.user);
}));

router.get('/:userId', asyncRouteFix(async (req, res) => {
  const { userId } = req.params;
  handleUserAccessControl(req.user, userId);

  res.json(await getUserFromDatabase(userId));
}));

router.put('/:userId', asyncRouteFix(async (req, res) => {
  const { userId } = req.params;
  handleUserAccessControl(req.user, userId);
  await ensureUserExists(userId);

  const { email, password, role, active, websites }: DatabaseUserWithWebsites = req.body;

  if (!email || !role || !websites) {
    throw new ExpressError('Email, role, and websites are required');
  }

  if (req.user.role !== 'ADMIN') {
    const user = await getUserFromDatabase(userId);

    if (user.role !== role || user.active !== active || user.websites.length !== websites.length ||
      !user.websites.every((w) => websites.includes(w))) {
      throw new ExpressError('Non-admin users cannot modify their own role, websites, or active status');
    }
  }

  await addOrUpdateUser({
    id: userId,
    email,
    password,
    role,
    active: active ?? false
  });

  await addOrUpdateUserWebsites(userId, websites);

  res.json({
    message: 'Account edited'
  });
}));

router.delete('/:userId', asyncRouteFix(async (req, res) => {
  const { userId } = req.params;
  handleAccessControl(res, req.user, 'ADMIN');
  await ensureUserExists(userId);

  await db().transaction(async (trx) => {
    await trx<UserWebsite>('user_websites')
      .where({
        userId
      })
      .delete();

    await trx<ApiKeyWebsite>('apikey_websites')
      .innerJoin('apikeys', 'apikeys.id', 'apikey_websites.apikeyId')
      .where({
        userId
      })
      .delete();

    await trx<ApiKey>('apikeys')
      .where({
        userId
      })
      .delete();

    await trx<DatabaseUser>('users')
      .where({
        id: userId
      })
      .delete();
  });

  res.json({
    message: 'Account deleted'
  });
}));

router.get('/:userId/keys', asyncRouteFix(async (req, res) => {
  const { userId } = req.params;
  handleUserAccessControl(req.user, userId);
  await ensureUserExists(userId);

  const apiKeys = await db()<ApiKey>('apikeys')
    .select('id', 'userId', 'role', 'active')
    .where({
      userId
    });
  const apiKeyWebsites: ApiKeyWebsite[] = await db()<ApiKeyWebsite>('apikey_websites')
    .select('apikeyId', 'websiteId')
    .innerJoin('apikeys', 'apikeys.id', 'apikey_websites.apikeyId')
    .where({
      userId
    });

  res.json(
    apiKeys
      .map((a) => ({
        ...a,
        websites: apiKeyWebsites.filter((w) => w.apikeyId === a.id).map((w) => w.websiteId)
      }))
      .map(handleUserBooleanConversion)
  );
}));

async function addOrUpdateApiKey(user: User, apiKey: Optional<DatabaseApiKey, 'key'>) {
  if (!(apiKey.role in ROLE_HIERARCHY)) {
    throw new ExpressError('Invalid role');
  }

  if (ROLE_HIERARCHY[apiKey.role] > ROLE_HIERARCHY[user.role]) {
    throw new ExpressError('API key cannot have higher role than user');
  }

  await db().transaction(async (trx) => {
    await trx<DatabaseApiKey>('apikeys')
      .insert({
        id: apiKey.id,
        userId: apiKey.userId,
        role: apiKey.role,
        active: apiKey.active
      })
      .onConflict('id')
      .merge(['role', 'active']);

    if (apiKey.key) {
      await trx<DatabaseApiKey>('apikeys')
        .update({
          // Hashing the API key would be better but that would prevent using Redis as a cache
          key: apiKey.key
        })
        .where({
          id: apiKey.id
        });
    }
  });
}

async function addOrUpdateApiKeyWebsites(apikeyId: string, websites: string[]) {
  await db().transaction(async (trx) => {
    const currentWebsites = await trx<ApiKeyWebsite>('apikey_websites')
      .select('websiteId')
      .where({
        apikeyId
      });

    const websitesToAdd = websites.filter((w) => !currentWebsites.some((v) => v.websiteId === w));
    const websitesToRemove = currentWebsites.filter((w) => !websites.includes(w.websiteId));

    if (websitesToAdd.length > 0) {
      await trx<UserWebsite>('apikey_websites')
        .insert(websitesToAdd.map((e) => ({
          apikeyId,
          websiteId: e
        })));
    }

    if (websitesToRemove.length > 0) {
      await trx<UserWebsite>('apikey_websites')
        .whereIn(
          ['apikeyId', 'websiteId'],
          websitesToRemove.map((w) => [apikeyId, w.websiteId])
        )
        .delete();
    }
  });
}

async function validateApiKeyRequest(req: Request) {
  const { userId } = req.params;
  const { role, websites }: ApiKeyWithWebsites = req.body;

  if (!role || !websites) {
    throw new ExpressError('Role and websites are required');
  }

  if (!Array.isArray(websites)) {
    throw new ExpressError('Websites must be an array');
  }

  const user = await getUserFromDatabase(userId);

  if (user.role !== 'ADMIN' && !websites.every((w) => user.websites.includes(w))) {
    throw new ExpressError('User does not have access to one or more websites');
  }
}

function generateApiKey() {
  return randomBytes(24).toString('base64url');
}

router.post('/:userId/keys', asyncRouteFix(async (req, res) => {
  const { userId } = req.params;
  handleUserAccessControl(req.user, userId);
  await validateApiKeyRequest(req);

  const { role, active, websites }: ApiKeyWithWebsites = req.body;

  const id = uuid();
  const key = generateApiKey();

  await addOrUpdateApiKey(req.user, {
    id,
    key,
    userId,
    role,
    active: active ?? false
  });

  await addOrUpdateApiKeyWebsites(id, websites);

  res.json({
    id,
    key,
    message: 'Created API key'
  });
}));

router.get('/:userId/keys/:keyId', asyncRouteFix(async (req, res) => {
  const { userId, keyId } = req.params;
  handleUserAccessControl(req.user, userId);
  await ensureUserExists(userId);

  const apiKey = await db()<ApiKey>('apikeys')
    .select('id', 'userId', 'role', 'active')
    .where({
      id: keyId
    })
    .first();
  const apiKeyWebsites = await db()<ApiKeyWebsite>('apikey_websites')
    .select('apikeyId', 'websiteId')
    .where({
      apikeyId: keyId
    });

  if (!apiKey) {
    throw new ExpressError('API key does not exist');
  }

  res.json(handleUserBooleanConversion({
    ...apiKey,
    websites: apiKeyWebsites.map((w) => w.websiteId)
  }));
}));

router.put('/:userId/keys/:keyId', asyncRouteFix(async (req, res) => {
  const { userId, keyId } = req.params;
  handleUserAccessControl(req.user, userId);
  await validateApiKeyRequest(req);

  if (!(await exists('apikeys', keyId))) {
    throw new ExpressError('API key does not exist');
  }

  const { role, active, websites }: ApiKeyWithWebsites = req.body;

  const id = keyId;

  await addOrUpdateApiKey(req.user, {
    id,
    userId,
    role,
    active: active ?? false
  });

  await addOrUpdateApiKeyWebsites(id, websites);

  res.json({
    message: 'Edited API key'
  });
}));

router.post('/:userId/keys/:keyId/reset', asyncRouteFix(async (req, res) => {
  const { userId, keyId } = req.params;
  handleUserAccessControl(req.user, userId);
  await ensureUserExists(userId);

  const id = keyId;
  const key = generateApiKey();

  if (!(await exists('apikeys', keyId))) {
    throw new ExpressError('API key does not exist');
  }

  await db()<DatabaseApiKey>('apikeys')
    .update({
      key
    })
    .where({
      id
    });

  res.json({
    id,
    key,
    message: 'Reset API key'
  });
}));

router.delete('/:userId/keys/:keyId', asyncRouteFix(async (req, res) => {
  const { userId, keyId } = req.params;
  handleUserAccessControl(req.user, userId);
  await ensureUserExists(userId);

  if (!(await exists('apikeys', keyId))) {
    throw new ExpressError('API key does not exist');
  }

  await db().transaction(async (trx) => {
    await trx<ApiKeyWebsite>('apikey_websites')
      .where({
        apikeyId: keyId
      })
      .delete();

    await trx<DatabaseApiKey>('apikeys')
      .where({
        id: keyId
      })
      .delete();
  });

  res.json({
    message: 'API key deleted'
  });
}));

export default router;
