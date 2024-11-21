import knex, { type Knex } from 'knex';
import init from './init';
import { getConfig } from '../config/config';

let k: Knex;
export default async function initDb() {
  const config = getConfig();

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
