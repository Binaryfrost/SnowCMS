import type { Knex } from 'knex';
import PaginatedQuery, { PaginatedQueryOpts } from '../../database/PaginatedQuery';
import Repository from '../Repository';
import WebsiteModel from './WebsiteModel';
import NotFoundError from '../../../common/errors/base/NotFoundError';

export interface WebsitesTable {
  id: string
  name: string
  hook?: string
}

export default class WebsiteRepository extends Repository {
  constructor(db: Knex) {
    super(db, 'websites');
  }

  async getAllWebsites(opts?: PaginatedQueryOpts): Promise<PaginatedQuery<WebsiteModel>> {
    const query = this.db<WebsitesTable>(this.table)
      .select('id', 'name', 'hook');

    return new PaginatedQuery<WebsiteModel>(this.db, query, opts);
  }

  async getWebsitesWithIds(ids: string[], opts?: PaginatedQueryOpts) {
    const query = this.db<WebsitesTable>(this.table)
      .select('id', 'name', 'hook')
      .whereIn('id', ids);

    return new PaginatedQuery<WebsiteModel>(this.db, query, opts);
  }

  async create(website: WebsiteModel) {
    await this.db<WebsitesTable>(this.table)
      .insert({
        id: website.getId(),
        name: website.getName(),
        hook: website.getHook()
      });
  }

  async update(website: WebsiteModel) {
    if (!(await this.exists(website.getId()))) {
      throw new NotFoundError('Website not found');
    }

    await this.db<WebsitesTable>(this.table)
      .insert({
        name: website.getName(),
        hook: website.getHook()
      })
      .update({
        id: website.getId()
      });
  }

  async delete(id: string) {
    if (!(await this.exists(id))) {
      throw new NotFoundError('Website not found');
    }

    await this.db<WebsitesTable>(this.table)
      .where({
        id
      })
      .delete();
  }
}
