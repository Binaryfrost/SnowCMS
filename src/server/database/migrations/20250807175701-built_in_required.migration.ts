import { Migration } from '.';
import type { DatabaseCollectionInput } from '../../../common/types/CollectionInputs';
import { db } from '../db';

const MIGRATION_NAME = '20250807175701-built_in_required';
const TABLE = 'collection_inputs';
const COLUMN = 'required';
const REQURIED_CONFIG_FIELD = 'required';

const migration: Migration = {
  async apply() {
    await db().transaction(async (trx) => {
      await trx.schema.alterTable(TABLE, (table) => {
        table.boolean(COLUMN).notNullable().defaultTo(false);
      });

      const collectionInputs = await trx<DatabaseCollectionInput>(TABLE).select('id', 'inputConfig');

      for await (const input of collectionInputs) {
        const { id, inputConfig } = input;
        if (!inputConfig) continue;
        try {
          if (
            REQURIED_CONFIG_FIELD in inputConfig &&
            typeof inputConfig[REQURIED_CONFIG_FIELD] === 'boolean'
          ) {
            await trx<DatabaseCollectionInput>(TABLE).update({
              required: Boolean(inputConfig[REQURIED_CONFIG_FIELD])
            }).where({
              id
            });
          }
        } catch {
          console.warn(`${MIGRATION_NAME}: Failed to parse settings for input ${input.id}`);
        }
      }
    });
  },
  
  async rollback() {
    await db().schema.alterTable(TABLE, (table) => {
      table.dropColumn(COLUMN);
    });
  },
};

export default migration;
