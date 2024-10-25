import { db } from './db';

export async function exists<T extends { id: string }>(table: string, id: string) {
  const [result] = await db()<T>(table)
    // @ts-ignore
    .where({
      id
    })
    .count({ count: '*' });

  return result.count !== 0;
}
