import { Migration } from '.';
import { db } from '../db';

const migration: Migration = {
  async apply() {
    if (!await db().schema.hasColumn('collections', 'callHook')) {
      await db().schema.alterTable('collections', (table) => {
        table.boolean('callHook').defaultTo(true);
      });
    }
  },

  async rollback() {
    if (await db().schema.hasColumn('collections', 'callHook')) {
      await db().schema.alterTable('collections', (table) => {
        table.dropColumn('callHook');
      });
    }
  }
};

export default migration;
