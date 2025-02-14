import { Migration } from '.';
import { db } from '../db';

const migration: Migration = {
  async apply() {
    await db().schema.raw('CREATE INDEX collection_entry_inputs_data_prefix ON collection_entry_inputs (data(10));');
  },

  async rollback() {
    await db().schema.raw('DROP INDEX collection_entry_inputs_data_prefix ON collection_entry_inputs;');
  }
};

export default migration;
