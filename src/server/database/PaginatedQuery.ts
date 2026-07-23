import type { Knex } from 'knex';
import ExpressError from '../../common/errors/base/ExpressError';
import Model from '../modules/Model';

export interface PaginatedQueryOpts {
  limit?: number
  page?: number
  sort?: 'asc' | 'desc'
  sortBy?: string
}

export default class PaginatedQuery<T extends Model> {
  private db: Knex;
  private query: Knex.QueryBuilder;
  private limit: number;
  private sort: 'asc' | 'desc';
  private sortBy: string;

  constructor(db: Knex, query: Knex.QueryBuilder, opts?: PaginatedQueryOpts) {
    this.db = db;
    this.query = query;
    this.limit = opts?.limit || 10;
    this.sort = opts?.sort || 'asc';
    this.sortBy = opts?.sortBy || 'id';

    // TODO: Replace ExpressErrors with dedicated error classes
    if (this.limit < 1 || this.limit > 100) {
      throw new ExpressError('Limit must be in range 1-100');
    }

    if (!['asc', 'desc'].includes(this.sort)) {
      throw new ExpressError('Sort must be either asc or desc');
    }
  }

  async metadata() {
    const newQuery = this.db()
      .count({ count: '*' })
      .from(this.query.as('C'));

    const { count } = await newQuery.first();

    return {
      limit: this.limit,
      pages: Math.ceil(count as number / this.limit),
      sort: this.sort
    };
  }

  async getPage(page: number): Promise<T[]> {
    return this.query
      .orderBy(this.sortBy, this.sort)
      .limit(this.limit)
      .offset((page - 1) * this.limit);
  }
}
