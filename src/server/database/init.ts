import { randomBytes } from 'crypto';
import { Knex } from 'knex';
import { v7 as uuid } from 'uuid';
import bcrypt from 'bcrypt';
import { DatabaseUser, User } from '../../common/types/User';
import { LAST_MIGRATION_METADATA_KEY, getMigrationTimestamp, runMigrations } from './migrations';

export default async function init(knex: Knex) {
  // See comments below about migrations
  const existingInstallation = await knex.schema.hasTable('websites');

  if (!await knex.schema.hasTable('websites')) {
    console.log('Creating websites table');
    await knex.schema.createTable('websites', (table) => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.string('hook').nullable();
    });
  }

  if (!await knex.schema.hasTable('collections')) {
    console.log('Creating collections table');
    await knex.schema.createTable('collections', (table) => {
      table.string('id').primary();
      table.string('websiteId').notNullable();
      table.string('name').notNullable();
      table.boolean('callHook').defaultTo(true);
      table.string('title');
      table.string('slug');

      table.foreign('websiteId').references('websites.id');
      table.foreign('title').references('collection_inputs.id');
      table.foreign('slug').references('collection_inputs.id');
    });
  }

  if (!await knex.schema.hasTable('collection_inputs')) {
    console.log('Creating collection_inputs table');
    await knex.schema.createTable('collection_inputs', (table) => {
      table.string('id').primary();
      table.string('collectionId').notNullable();
      table.string('name').notNullable();
      table.string('description').nullable();
      table.string('fieldName').notNullable();
      table.string('input').notNullable();
      table.text('inputConfig').nullable();
      table.integer('order').unsigned().notNullable();

      table.foreign('collectionId').references('collections.id');
    });
  }

  if (!await knex.schema.hasTable('collection_entries')) {
    console.log('Creating collection_entries table');
    await knex.schema.createTable('collection_entries', (table) => {
      table.string('id').primary();
      table.string('collectionId').notNullable();
      table.integer('createdAt').unsigned().notNullable();
      table.integer('updatedAt').unsigned().notNullable();

      table.foreign('collectionId').references('collections.id');
    });
  }

  if (!await knex.schema.hasTable('collection_entry_inputs')) {
    console.log('Creating collection_entry_inputs table');
    await knex.schema.createTable('collection_entry_inputs', (table) => {
      table.string('entryId');
      table.string('inputId');
      table.text('data', 'mediumtext').nullable();

      table.primary(['entryId', 'inputId']);
      table.foreign('entryId').references('collection_entries.id');
      table.foreign('inputId').references('collection_inputs.id');
    });

    await knex.schema.raw('CREATE INDEX collection_entry_inputs_data_prefix ON collection_entry_inputs (data(10));');
  }

  if (!await knex.schema.hasTable('media')) {
    console.log('Creating media table');
    await knex.schema.createTable('media', (table) => {
      table.string('id').primary();
      table.string('websiteId').notNullable();
      table.string('origFileName').notNullable();
      table.string('fileName').notNullable();
      table.integer('fileSize').unsigned().notNullable();
      table.string('fileType').notNullable();
      table.string('thumbName').nullable();
      table.integer('timestamp').unsigned().notNullable();

      table.foreign('websiteId').references('websites.id');
    });
  }

  if (!await knex.schema.hasTable('users')) {
    console.log('Creating users table');
    await knex.schema.createTable('users', (table) => {
      table.string('id').primary();
      table.string('email').unique();
      table.string('password', 60);
      table.string('role');
      table.boolean('active');
    });
  }

  const userCount = await knex<User>('users')
    .count({ count: '*' })
    .first();
  if (userCount.count === 0) {
    const email = 'admin@snowcms';
    const password = randomBytes(12).toString('base64url');

    await knex<DatabaseUser>('users')
      .insert({
        id: uuid(),
        email,
        password: await bcrypt.hash(password, 10),
        role: 'ADMIN',
        active: true
      });

    const msg = '----------\n' +
      'Created default admin account\n\n' +
      `Email: ${email}\n` +
      `Password: ${password}\n` +
      '----------';
    console.log(msg);
  }

  if (!await knex.schema.hasTable('user_websites')) {
    console.log('Creating user_websites table');
    await knex.schema.createTable('user_websites', (table) => {
      table.string('userId');
      table.string('websiteId');

      table.primary(['userId', 'websiteId']);
      table.foreign('userId').references('users.id');
      table.foreign('websiteId').references('websites.id');
    });
  }

  if (!await knex.schema.hasTable('apikeys')) {
    console.log('Creating apikeys table');
    await knex.schema.createTable('apikeys', (table) => {
      table.string('id').primary();
      table.string('key');
      table.string('userId');
      table.string('name');
      table.string('role');
      table.boolean('active');

      table.foreign('userId').references('users.id');
    });
  }

  if (!await knex.schema.hasTable('apikey_websites')) {
    console.log('Creating apikey_websites table');
    await knex.schema.createTable('apikey_websites', (table) => {
      table.string('apikeyId');
      table.string('websiteId');

      table.primary(['apikeyId', 'websiteId']);
      table.foreign('apikeyId').references('apikeys.id');
      table.foreign('websiteId').references('websites.id');
    });
  }

  if (!await knex.schema.hasTable('metadata')) {
    console.log('Creating metadata table');
    await knex.schema.createTable('metadata', (table) => {
      table.string('key').primary();
      table.string('value');
    });

    /*
     * To ensure that old migrations don't run on new installations,
     * we store the installation time in the database as the timestamp
     * of the last migration, thus stopping older migrations from running.
     * However, because the version that added migration code contains
     * a migration, this solution would prevent that migration from
     * running. The solution to this is to detect whether this is an
     * existing installation, and if so, set the timestamp to 0,
     * forcing the migration to run.
     *
     * TODO: Remove the existing installation check in a future version.
     */
    const migrationTimestamp = existingInstallation ? '0' : getMigrationTimestamp();

    await knex('metadata')
      .insert({
        key: LAST_MIGRATION_METADATA_KEY,
        value: migrationTimestamp
      });
  }

  await runMigrations();
}
