import type { Knex } from 'knex';
import PaginatedQuery, { PaginatedQueryOpts } from '../../../database/PaginatedQuery';
import Repository from '../../Repository';
import { Role } from '../UserRepository';
import ApiKeyModel from './ApiKeyModel';
import NotFoundError from '../../../../common/errors/base/NotFoundError';

export interface ApiKeysTable {
  id: string
  key: string
  userId: string
  name: string
  role: Role
  active: boolean
}

export interface ApiKeyWebsitesTable {
  apikeyId: string
  websiteId: string
}

export default class ApiKeyRepository extends Repository {
  private readonly apiKeyWebsitesTableName = 'apikey_websites';
  constructor(db: Knex) {
    super(db, 'apikeys');
  }

  async getApiKeys(opts?: PaginatedQueryOpts): Promise<PaginatedQuery<ApiKeyModel>> {
    const query = this.db<ApiKeysTable>(this.table)
      .select('id', 'key', 'userId', 'name', 'role', 'active');

    return new PaginatedQuery<ApiKeyModel>(
      this.db,
      query,
      opts,
      (row) => new ApiKeyModel(
        row.id,
        row.key,
        row.userId,
        row.name,
        row.role,
        Boolean(row.active)
      )
    );
  }

  async getUserApiKeys(
    userId: string, opts?: PaginatedQueryOpts
  ): Promise<PaginatedQuery<ApiKeyModel>> {
    const query = this.db<ApiKeysTable>(this.table)
      .select('id', 'key', 'userId', 'name', 'role', 'active')
      .where({
        userId
      });

    return new PaginatedQuery<ApiKeyModel>(
      this.db,
      query,
      opts,
      (row) => new ApiKeyModel(
        row.id,
        row.key,
        row.userId,
        row.name,
        row.role,
        Boolean(row.active)
      )
    );
  }

  async getApiKeyById(id: string): Promise<ApiKeyModel | null> {
    const row = await this.db<ApiKeysTable>(this.table)
      .select('id', 'key', 'userId', 'name', 'role', 'active')
      .where({
        id
      })
      .first();

    if (!row) return null;
    return new ApiKeyModel(
      row.id,
      row.key,
      row.userId,
      row.name,
      row.role,
      Boolean(row.active)
    );
  }

  async getApiKeyWebsites(id: string): Promise<string[]> {
    if (!(await this.exists(id))) {
      throw new NotFoundError('API Key not found');
    }

    const websiteIds = await this.db<ApiKeyWebsitesTable>(this.apiKeyWebsitesTableName)
      .select('websiteId')
      .where({
        apikeyId: id
      });

    return websiteIds.map((w) => w.websiteId);
  }

  async deleteApiKeyWebsites(id: string, websites: string[]) {
    if (!(await this.exists(id))) {
      throw new NotFoundError('API Key not found');
    }

    await this.db<ApiKeyWebsitesTable>(this.apiKeyWebsitesTableName)
      .whereIn(
        ['apikeyId', 'websiteId'],
        websites.map((website) => [id, website])
      )
      .delete();
  }

  async addApiKeyWebsites(id: string, websites: string[]) {
    if (!(await this.exists(id))) {
      throw new NotFoundError('API Key not found');
    }

    await this.db<ApiKeyWebsitesTable>(this.apiKeyWebsitesTableName)
      .insert(
        websites.map((website) => ({
          apikeyId: id,
          websiteId: website
        }))
      );
  }

  async create(apiKey: ApiKeyModel) {
    await this.db<ApiKeysTable>(this.table)
      .insert({
        id: apiKey.getId(),
        key: apiKey.getKey(),
        userId: apiKey.getUserId(),
        name: apiKey.getName(),
        role: apiKey.getRole(),
        active: apiKey.isActive()
      });
  }

  async update(apiKey: ApiKeyModel) {
    if (!(await this.exists(apiKey.getId()))) {
      throw new NotFoundError('API Key not found');
    }

    await this.db<ApiKeysTable>(this.table)
      .update({
        name: apiKey.getName(),
        role: apiKey.getRole(),
        active: apiKey.isActive()
      })
      .where({
        id: apiKey.getId()
      });
  }

  async updateKey(id: string, key: string) {
    if (!(await this.exists(id))) {
      throw new NotFoundError('API Key not found');
    }

    await this.db<ApiKeysTable>(this.table)
      .update({
        key
      })
      .where({
        id
      });
  }

  async delete(id: string) {
    if (!(await this.exists(id))) {
      throw new NotFoundError('API Key not found');
    }

    await this.db.transaction(async (trx) => {
      await trx<ApiKeyWebsitesTable>(this.apiKeyWebsitesTableName)
        .where({
          apikeyId: id
        })
        .delete();

      await trx<ApiKeysTable>(this.table)
        .where({
          id
        })
        .delete();
    });
  }

  async removeWebsiteAccess(websiteId: string) {
    await this.db<ApiKeyWebsitesTable>(this.apiKeyWebsitesTableName)
      .where({
        websiteId
      })
      .delete();
  }
}
