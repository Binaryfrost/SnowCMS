import { db } from './db';
import type { Collection } from '../../common/types/Collection';
import type { Website } from '../../common/types/Website';
import type { DatabaseCollectionInput } from '../../common/types/CollectionInputs';
import { ApiKeyWithWebsites, UserWithWebsites } from '../../common/types/User';

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
