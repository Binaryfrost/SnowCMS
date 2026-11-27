import type { Knex } from 'knex';
import PaginatedQuery, { PaginatedQueryOpts } from '../../../../database/PaginatedQuery';
import Repository from '../../../Repository';
import CollectionEntryDraftModel, { CollectionEntryDraftSummaryModel } from './CollectionEntryDraftModel';
import NotFoundError from '../../../../../common/errors/base/NotFoundError';

export interface CollectionEntryDraftTable {
  id: string
  entryId: string | null
  collectionId: string
  createdAt: number
  updatedAt: number
  data: Record<string, string>
}

export default class CollectionEntryDraftRepository extends Repository {
  constructor(db: Knex) {
    super(db, 'collection_entry_drafts');
  }

  async getAllDrafts(
    collectionId: string,
    search?: string,
    titleFieldName?: string,
    entryId?: string,
    opts?: PaginatedQueryOpts
  ) {
    const searchQuery = search ? `%${search}%` : undefined;

    const query = this.db<CollectionEntryDraftTable>(this.table)
      .select(
        'id',
        'entryId',
        'collectionId',
        'createdAt',
        'updatedAt',
        'data'
      )
      .where({
        collectionId
      });

    if (entryId) {
      query.andWhere({
        entryId
      });
    }

    if (searchQuery) {
      query.andWhere((builder) => {
        builder.whereILike('id', searchQuery);

        if (titleFieldName) {
          builder.orWhereRaw(
            'LOWER(JSON_UNQUOTE(JSON_EXTRACT(data, ?))) LIKE LOWER(?)',
            [`$.${titleFieldName}`, searchQuery]
          );
        }
      });
    }

    return new PaginatedQuery<CollectionEntryDraftSummaryModel>(
      this.db,
      query,
      opts,
      (row) => {
        const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        return new CollectionEntryDraftSummaryModel(
          row.id,
          row.entryId,
          row.collectionId,
          row.createdAt,
          row.updatedAt,
          titleFieldName ? data?.[titleFieldName] : null
        );
      }
    );
  }

  async getDraft(id: string): Promise<CollectionEntryDraftModel | null> {
    const row = await this.db<CollectionEntryDraftTable>(this.table)
      .select('id', 'entryId', 'collectionId', 'createdAt', 'updatedAt', 'data')
      .where({
        id
      })
      .first();

    if (!row) return null;
    const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    return new CollectionEntryDraftModel(
      row.id,
      row.entryId,
      row.collectionId,
      row.createdAt,
      row.updatedAt,
      data
    );
  }

  async create(draft: CollectionEntryDraftModel) {
    await this.db<CollectionEntryDraftTable>(this.table)
      .insert({
        id: draft.getId(),
        entryId: draft.getEntryId(),
        collectionId: draft.getCollectionId(),
        createdAt: draft.getCreatedAt(),
        updatedAt: draft.getUpdatedAt(),
        data: JSON.stringify(draft.getData()) as any
      });
  }

  async update(draft: CollectionEntryDraftModel) {
    if (!(await this.exists(draft.getId()))) {
      throw new NotFoundError('Collection Entry Draft not found');
    }

    await this.db<CollectionEntryDraftTable>(this.table)
      .update({
        entryId: draft.getEntryId(),
        updatedAt: draft.getUpdatedAt(),
        data: JSON.stringify(draft.getData()) as any
      })
      .where({
        id: draft.getId()
      });
  }

  async delete(id: string) {
    if (!(await this.exists(id))) {
      throw new NotFoundError('Collection Entry Draft not found');
    }

    await this.db<CollectionEntryDraftTable>(this.table)
      .where({
        id
      })
      .delete();
  }

  async entryExists(entryId: string) {
    const row = await this.db<CollectionEntryDraftTable>('collection_entries')
      .select('id')
      .where({
        id: entryId
      })
      .first();

    return !!row;
  }
}
