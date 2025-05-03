import { Migration } from '.';
import { db } from '../db';

const TABLE = 'collection_entry_drafts';

const migration: Migration = {
  async apply() {
    if (!await db().schema.hasTable(TABLE)) {
      await db().schema.createTable(TABLE, (table) => {
        table.string('id').primary();
        table.integer('createdAt');
        table.integer('updatedAt');
        table.string('entryId').nullable();
        table.json('data');

        table.foreign('entryId').references('collection_entries.id');
      })
    }
  },

  async rollback() {
    if (await db().schema.hasTable(TABLE)) {
      await db().schema.dropTable(TABLE);
    }
  }
};

export default migration;
