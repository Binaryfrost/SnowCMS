import type { Knex } from 'knex';
import { Migration } from '.';
import { db } from '../db';

async function tableExists(trx: Knex.Transaction) {
  return trx.schema.hasTable('collection_titles');
}

async function columnExists(trx: Knex.Transaction) {
  return trx.schema.hasColumn('collections', 'title');
}

const migration: Migration = {
  async apply() {
    await db().transaction(async (trx) => {
      if (!await columnExists(trx)) {
        await trx.schema.alterTable('collections', (table) => {
          table.string('title');
          table.foreign('title').references('collection_inputs.id');
        });
      }

      if (await tableExists(trx)) {
        const titles: { collectionId: string, inputId: string }[] =
          await db()('collection_titles')
            .select('collectionId', 'inputId');

        for await (const title of titles) {
          await trx('collections')
            .update({
              title: title.inputId
            })
            .where({
              id: title.collectionId
            });
        }

        await trx.schema.dropTable('collection_titles');
      }
    });
  },

  async rollback() {
    await db().transaction(async (trx) => {
      if (!await tableExists(trx)) {
        await trx.schema.createTable('collection_titles', (table) => {
          table.string('collectionId').primary();
          table.string('inputId');

          table.foreign('collectionId').references('collections.id');
          table.foreign('inputId').references('collection_inputs.id');
        });
      }

      if (await columnExists(trx)) {
        const collections: { id: string, title: string }[] =
          await trx('collections')
            .select('id', 'title');

        await trx.insert(
          collections.map((collection) => ({
            collectionId: collection.id,
            inputId: collection.title
          }))
        )
          .into('collection_titles');

        await trx.schema.alterTable('collections', (table) => {
          table.dropColumn('title');
        });
      }
    });
  }
};

export default migration;
