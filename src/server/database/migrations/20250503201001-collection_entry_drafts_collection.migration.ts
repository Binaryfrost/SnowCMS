import { Migration } from '.';
import { db } from '../db';

const TABLE = 'collection_entry_drafts';
const COLUMN = 'collectionId';

const migration: Migration = {
  async apply() {
    if (!await db().schema.hasColumn(TABLE, COLUMN)) {
      await db().schema.alterTable(TABLE, (table) => {
        table.string(COLUMN);
        table.foreign(COLUMN).references('collections.id');
      });
    }
  },

  async rollback() {
    if (!await db().schema.hasColumn(TABLE, COLUMN)) {
      await db().schema.alterTable(TABLE, (table) => {
        table.dropColumn(COLUMN);
      });
    }
  }
};

export default migration;
