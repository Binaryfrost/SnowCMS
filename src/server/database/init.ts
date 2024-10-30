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
    console.log('Creating collection inputs table');
    await knex.schema.createTable('collection_inputs', (table) => {
      table.string('id').primary();
      table.string('collectionId').notNullable();
      table.string('name').notNullable();
      table.string('description').nullable();
      table.string('fieldName').notNullable();
      table.string('input').notNullable();
      table.string('inputConfig').nullable();
      table.integer('order').notNullable();

      table.foreign('collectionId').references('collections.id');
    });
  }

  if (!await knex.schema.hasTable('collection_titles')) {
    console.log('Creating collection titles table');
    await knex.schema.createTable('collection_titles', (table) => {
      table.string('collectionId');
      table.string('inputId');

      table.primary(['collectionId', 'inputId']);
      table.foreign('collectionId').references('collections.id');
      table.foreign('inputId').references('collection_inputs.id');
    });
  }
}
