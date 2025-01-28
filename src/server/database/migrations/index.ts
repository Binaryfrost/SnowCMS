import { db } from '../db';

export interface Migration {
  /** The function called to apply the migration  */
  apply: () => Promise<void>
  /** The function called to roll back the migration in case of an error */
  rollback?: () => Promise<void>
}

interface InternalMigration extends Migration {
  /** The unique ID for this migration; the file name (without extension is used) */
  id: string
  /** The timestamp (in format YYYYMMDDHHMMSSNN) that this migration was made */
  timestamp: string
}

export const LAST_MIGRATION_METADATA_KEY = 'last-migration';

function loadMigrations(lastTimestamp: string) {
  // @ts-expect-error require.context is a Webpack feature
  const context = require.context(
    './',
    false,
    /\.migration.ts$/
  );

  const migrations: InternalMigration[] = [];

  context.keys()
    .filter((fileName: string) => !fileName.startsWith('./_'))
    .forEach((fileName: string) => {
      const [ts, name] = fileName
        .replace('.migration.ts', '')
        .replace('./', '')
        .split('-');

      if (ts > lastTimestamp) {
        migrations.push({
          id: `${ts}-${name}`,
          timestamp: ts,
          ...context(fileName).default
        });
      }
    });

  return migrations;
}

export async function runMigrations() {
  const { value: timestamp } = await db()('metadata')
    .select('key', 'value')
    .where({
      key: LAST_MIGRATION_METADATA_KEY
    })
    .first();
  const migrations = loadMigrations(timestamp);

  for await (const migration of migrations) {
    try {
      await migration.apply();
      console.log(`Applied migration ${migration.id}`);

      await db()('metadata')
        .insert({
          key: LAST_MIGRATION_METADATA_KEY,
          value: migration.timestamp
        })
        .onConflict()
        .merge();
    } catch (e) {
      console.log(`Rolling back migration ${migration.id} due to error`, e);

      try {
        await migration.rollback?.();
        throw new Error(`Failed to run migration ${migration.id}: ${e}`);
      } catch (r) {
        throw new Error(`Failed to roll back migration ${migration.id}: ${r}`);
      }
    }
  }
}

function padNumber(num: number) {
  return num.toString().padStart(2, '0');
}

export function getMigrationTimestamp() {
  const date = new Date();

  const year = date.getUTCFullYear();
  const month = padNumber((date.getUTCMonth() + 1));
  const day = padNumber(date.getUTCDate());
  const hour = padNumber(date.getUTCHours());
  const minute = padNumber(date.getUTCMinutes());
  const increment = 99;

  return `${year}${month}${day}${hour}${minute}${increment}`;
}
