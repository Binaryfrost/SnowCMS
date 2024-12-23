import { db } from './db';
import type { Collection } from '../../common/types/Collection';
import type { Website } from '../../common/types/Website';
import type { DatabaseCollectionInput } from '../../common/types/CollectionInputs';
import { ApiKeyWithWebsites, User, UserWebsite, UserWithWebsites } from '../../common/types/User';
import { redis } from './redis';
import ExpressError from '../../common/ExpressError';

export async function exists<T extends { id: string }>(table: string, id: string) {
  const [result] = await db()<T>(table)
    // @ts-ignore
    .where({
      id
    })
    .count({ count: '*' });

  return result.count !== 0;
}

export async function getWebsite(id: string) {
  return db()<Website>('websites')
    .select('id', 'name', 'hook')
    .where({
      id
    })
    .first();
}

export async function getCollection(id: string) {
  return db()<Collection>('collections')
    .select('id', 'websiteId', 'name')
    .where({
      id
    })
    .first();
}

export async function getCollectionInputs(collectionId: string) {
  return db()<DatabaseCollectionInput>('collection_inputs')
    .select('id', 'collectionId', 'name', 'description', 'fieldName', 'input', 'inputConfig')
    .where({
      collectionId
    })
    .orderBy('order', 'asc');
}

// https://softwareengineering.stackexchange.com/a/304597
export async function reorderCollectionInputs(inputId: string, collectionId: string,
  newPosition: number) {
  const oldPosition = (await db<DatabaseCollectionInput>()
    .select('order')
    .from('collection_inputs')
    .where({
      id: inputId
    })
    .first()).order;

  if (newPosition === oldPosition) return;

  if (newPosition > oldPosition) {
    await db<DatabaseCollectionInput>()
      .table('collection_inputs')
      .decrement('order', 1)
      .where({
        collectionId
      })
      .andWhere('order', '>', oldPosition)
      .andWhere('order', '<=', newPosition);
  } else {
    await db<DatabaseCollectionInput>()
      .table('collection_inputs')
      .increment('order', 1)
      .where({
        collectionId
      })
      .andWhere('order', '>=', newPosition)
      .andWhere('order', '<=', oldPosition);
  }

  await db<DatabaseCollectionInput>()
    .table('collection_inputs')
    .update({
      order: newPosition
    })
    .where({
      id: inputId
    });
}

export function handleUserBooleanConversion
  <T extends UserWithWebsites | ApiKeyWithWebsites>(user: T): T {
  return {
    ...user,
    active: Boolean(user.active)
  };
}

export async function getSession(token: string) {
  return redis().get(`session:${token}`);
}

export async function getUserFromDatabase(id: string): Promise<UserWithWebsites> {
  const user = await db()<User>('users')
    .select('id', 'email', 'role', 'active')
    .where({
      id
    })
    .first();

  if (!user) {
    throw new ExpressError('User not found', 404);
  }

  const userWebsites = await db()<UserWebsite>('user_websites')
    .select('userId', 'websiteId')
    .where({
      userId: id
    });

  return handleUserBooleanConversion({
    ...user,
    websites: userWebsites.filter((w) => w.userId === id).map((w) => w.websiteId)
  });
}

export async function getUser(id: string): Promise<UserWithWebsites> {
  const cachedUser = await redis().get(`user:${id}`);
  if (cachedUser) return JSON.parse(cachedUser);

  let user = null;

  try {
    user = await getUserFromDatabase(id);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {}

  if (user && !cachedUser) {
    await redis().set(`user:${id}`, JSON.stringify(user), {
      EX: 10 * 60
    });
  }

  return user;
}
