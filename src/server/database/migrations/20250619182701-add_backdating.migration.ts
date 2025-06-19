import { Migration } from '.';
import { db } from '../db';

const TABLE = 'collections';
const COLUMN = 'backdatingEnabled';

const migration: Migration = {
  async apply() {
    await db().schema.alterTable(TABLE, (table) => {
      table.boolean(COLUMN).defaultTo(false);
    });
  },
  async rollback() {
    await db().schema.alterTable(TABLE, (table) => {
      table.dropColumn(COLUMN);
    });
  }
};

export default migration;
