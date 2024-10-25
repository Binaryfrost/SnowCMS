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
}
