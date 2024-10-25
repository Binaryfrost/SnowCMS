import knex, { type Knex } from 'knex';
import type { NormalizedConfig } from '../../config';
import init from './init';

let k: Knex;
export default async function initDb(config: NormalizedConfig) {
  k = knex({
    client: 'mysql2',
    connection: {
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password,
      database: config.database.database,
      enableKeepAlive: true
    }
  });

  await init(k);
}

export function db<T = any>() {
  return k as Knex<T>;
}
