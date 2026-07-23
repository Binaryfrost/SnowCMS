import type { Knex } from 'knex';
import PaginatedQuery, { PaginatedQueryOpts } from '../../database/PaginatedQuery';
import Repository from '../Repository';
import CollectionModel from './CollectionModel';
import NotFoundError from '../../../common/errors/base/NotFoundError';

export interface CollectionsTable {
  id: string
  websiteId: string
  name: string
  callHook: boolean
  title: string | null
  slug: string | null
  backdatingEnabled: boolean
}

export default class CollectionRepository extends Repository {
  constructor(db: Knex) {
    super(db, 'collections');
  }

  async getAllCollections(
    websiteId: string,
    opts?: PaginatedQueryOpts
  ): Promise<PaginatedQuery<CollectionModel>> {
    const query = this.db<CollectionsTable>(this.table)
      .select('id', 'websiteId', 'name', 'callHook', 'title', 'slug', 'backdatingEnabled')
      .where({
        websiteId
      });

    return new PaginatedQuery<CollectionModel>(this.db, query, opts);
  }

  async getCollection(collectionId: string) {
    const query = await this.db<CollectionsTable>(this.table)
      .first('id', 'websiteId', 'name', 'callHook', 'title', 'slug', 'backdatingEnabled')
      .where({
        id: collectionId
      });

    if (!query) return null;
    const { id, websiteId, name, callHook, title, slug, backdatingEnabled } = query;
    return new CollectionModel(id, websiteId, name, callHook, title, slug, backdatingEnabled);
  }

  async create(collection: CollectionModel) {
    await this.db<CollectionsTable>(this.table)
      .insert({
        id: collection.getId(),
        websiteId: collection.getWebsiteId(),
        name: collection.getName(),
        callHook: collection.shouldCallHook(),
        title: collection.getTitle(),
        slug: collection.getSlug(),
        backdatingEnabled: collection.isBackdatingEnabled()
      });
  }

  async update(collection: CollectionModel) {
    if (!(await this.exists(collection.getId()))) {
      throw new NotFoundError('Collection not found');
    }

    const updateData: Partial<CollectionsTable> = {
      name: collection.getName(),
      callHook: collection.shouldCallHook(),
      title: collection.getTitle(),
      slug: collection.getSlug(),
      backdatingEnabled: collection.isBackdatingEnabled()
    };

    await this.db<CollectionsTable>(this.table)
      .update(updateData)
      .where({
        id: collection.getId()
      });
  }

  async removeInputReferences(inputId: string) {
    await this.db<CollectionsTable>(this.table)
      .update({
        title: null
      })
      .where({
        title: inputId
      });

    await this.db<CollectionsTable>(this.table)
      .update({
        slug: null
      })
      .where({
        slug: inputId
      });
  }

  async delete(id: string) {
    if (!(await this.exists(id))) {
      throw new NotFoundError('Collection not found');
    }

    await this.db<CollectionsTable>(this.table)
      .delete()
      .where({
        id
      });
  }
}
