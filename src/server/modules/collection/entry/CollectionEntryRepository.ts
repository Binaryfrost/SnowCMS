import type { Knex } from 'knex';
import PaginatedQuery, { PaginatedQueryOpts } from '../../../database/PaginatedQuery';
import Repository from '../../Repository';
import CollectionEntryModel, {
  CollectionEntryInputModel,
  CollectionEntryWithMetadataModel
} from './CollectionEntryModel';
import NotFoundError from '../../../../common/errors/base/NotFoundError';

export interface CollectionEntryTable {
  id: string
  collectionId: string
  createdAt: number
  updatedAt: number
}

export interface CollectionEntryInputTable {
  entryId: string
  inputId: string
  data: string
}

export default class CollectionEntryRepository extends Repository {
  constructor(db: Knex) {
    super(db, 'collection_entries');
  }

  async getAllEntries(
    collectionId: string,
    search?: string,
    opts?: PaginatedQueryOpts
  ) {
    const searchQuery = search ? `%${search}%` : undefined;

    const query = this.db
      .select(
        'collection_entries.id',
        'collection_entries.collectionId',
        'collection_entries.createdAt',
        'collection_entries.updatedAt',
        'title_input.data AS title',
        'slug_input.data AS slug'
      )
      .from('collection_entries')
      .leftJoin('collections', 'collection_entries.collectionId', 'collections.id')
      .leftJoin({ title_input: 'collection_entry_inputs' }, (builder) => {
        builder.on('title_input.entryId', 'collection_entries.id')
          .andOn('title_input.inputId', 'collections.title');
      })
      .leftJoin({ slug_input: 'collection_entry_inputs' }, (builder) => {
        builder.on('slug_input.entryId', 'collection_entries.id')
          .andOn('slug_input.inputId', 'collections.slug');
      })
      .where('collection_entries.collectionId', collectionId)
      .andWhere((builder) => {
        if (searchQuery) {
          builder.whereILike('collection_entries.id', searchQuery)
            .orWhereILike('title_input.data', searchQuery);
        }
      });

    return new PaginatedQuery<CollectionEntryWithMetadataModel>(
      this.db,
      query,
      {
        ...opts,
        sortBy: opts?.sortBy || 'createdAt'
      },
      (row) => new CollectionEntryWithMetadataModel(
        row.id,
        row.collectionId,
        row.createdAt,
        row.updatedAt,
        row.title,
        row.slug
      )
    );
  }

  async getEntry(id: string): Promise<CollectionEntryModel | null> {
    const row = await this.db<CollectionEntryTable>(this.table)
      .select('id', 'collectionId', 'createdAt', 'updatedAt')
      .where({
        id
      })
      .first();

    if (!row) return null;
    return new CollectionEntryModel(row.id, row.collectionId, row.createdAt, row.updatedAt);
  }

  async getEntryInputs(entryId: string): Promise<CollectionEntryInputModel[]> {
    const rows = await this.db<CollectionEntryInputTable>('collection_entry_inputs')
      .select('entryId', 'inputId', 'data')
      .where({
        entryId
      });

    return rows.map((row) => new CollectionEntryInputModel(row.entryId, row.inputId, row.data));
  }

  async getEntryIdBySlug(inputId: string, slug: string): Promise<string | null> {
    const row = await this.db<CollectionEntryInputTable>('collection_entry_inputs')
      .select('entryId')
      .where({
        inputId,
        data: slug
      })
      .first();

    return row?.entryId || null;
  }

  async hasEntryWithSlug(inputId: string, slug: string, exceptEntryId?: string) {
    const query = this.db<CollectionEntryInputTable>('collection_entry_inputs')
      .select('entryId')
      .where({
        inputId,
        data: slug
      });

    if (exceptEntryId) {
      query.andWhereNot({
        entryId: exceptEntryId
      });
    }

    const row = await query.first();
    return !!row;
  }

  async create(entry: CollectionEntryModel, inputs: CollectionEntryInputModel[]) {
    await this.db.transaction(async (trx) => {
      await trx<CollectionEntryTable>(this.table)
        .insert({
          id: entry.getId(),
          collectionId: entry.getCollectionId(),
          createdAt: entry.getCreatedAt(),
          updatedAt: entry.getUpdatedAt()
        });

      await trx<CollectionEntryInputTable>('collection_entry_inputs')
        .insert(inputs.map((input) => ({
          entryId: input.getEntryId(),
          inputId: input.getInputId(),
          data: input.getData()
        })));
    });
  }

  async update(entry: CollectionEntryModel, inputs: CollectionEntryInputModel[]) {
    if (!(await this.exists(entry.getId()))) {
      throw new NotFoundError('Collection Entry not found');
    }

    await this.db.transaction(async (trx) => {
      await trx<CollectionEntryTable>(this.table)
        .update({
          updatedAt: entry.getUpdatedAt()
        })
        .where({
          id: entry.getId()
        });

      await trx<CollectionEntryInputTable>('collection_entry_inputs')
        .insert(inputs.map((input) => ({
          entryId: input.getEntryId(),
          inputId: input.getInputId(),
          data: input.getData()
        })))
        .onConflict(['entryId', 'inputId'])
        .merge(['data']);
    });
  }

  async delete(id: string) {
    if (!(await this.exists(id))) {
      throw new NotFoundError('Collection Entry not found');
    }

    await this.db.transaction(async (trx) => {
      await trx<CollectionEntryInputTable>('collection_entry_inputs')
        .where({
          entryId: id
        })
        .delete();

      await trx('collection_entry_drafts')
        .where({
          entryId: id
        })
        .delete();

      await trx<CollectionEntryTable>(this.table)
        .where({
          id
        })
        .delete();
    });
  }
}
