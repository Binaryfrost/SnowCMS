import { Migration } from '.';
import { db } from '../db';

const migration: Migration = {
  async apply() {
    if (!await db().schema.hasColumn('collections', 'slug')) {
      await db().schema.alterTable('collections', (table) => {
        table.string('slug');
        table.foreign('slug').references('collection_inputs.id');
      });
    }
  },

  async rollback() {
    if (!await db().schema.hasColumn('collections', 'slug')) {
      await db().schema.alterTable('collections', (table) => {
        table.dropColumn('slug');
      });
    }
  }
};

export default migration;
