import { Migration } from '.';
import type { CollectionInputTable } from '../../modules/collection/input/CollectionInputRepository';
import { db } from '../db';

const TABLE = 'collection_inputs';

const migration: Migration = {
  async apply() {
    await db().transaction(async (trx) => {
      await trx(TABLE).update({
        inputConfig: '{}'
      }).where({
        inputConfig: ''
      });

      await trx.schema.alterTable(TABLE, (table) => {
        table.json('inputConfig').alter();
      });
    });
  },
  
  async rollback() {
    await db().transaction(async (trx) => {
      await trx.schema.alterTable(TABLE, (table) => {
        table.text('inputConfig').alter();
      });

      await trx(TABLE).update({
        inputConfig: ''
      }).where({
        inputConfig: '{}'
      });
    });
  }
};

export default migration;
