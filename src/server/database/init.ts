import { Knex } from 'knex';

export default async function init(knex: Knex) {
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

      table.foreign('websiteId').references('websites.id');
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

  if (!await knex.schema.hasTable('collection_titles')) {
    console.log('Creating collection_titles table');
    await knex.schema.createTable('collection_titles', (table) => {
      table.string('collectionId').primary();
      table.string('inputId');

      table.foreign('collectionId').references('collections.id');
      table.foreign('inputId').references('collection_inputs.id');
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
      table.text('data', 'mediumtext').notNullable();

      table.primary(['entryId', 'inputId']);
      table.foreign('entryId').references('collection_entries.id');
      table.foreign('inputId').references('collection_inputs.id');
    });
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
}
