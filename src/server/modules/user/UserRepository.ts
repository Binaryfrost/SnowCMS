import type { Knex } from 'knex';
import PaginatedQuery, { type PaginatedQueryOpts } from '../../database/PaginatedQuery';
import UserModel from './UserModel';
import { ROLE_HIERARCHY } from '../../../common/users';
import Repository from '../Repository';
import NotFoundError from '../../../common/errors/base/NotFoundError';

export type Role = keyof typeof ROLE_HIERARCHY;
export interface UsersTable {
  id: string
  email: string
  password: string
  role: Role
  active: boolean
}
export interface UserWebsitesTable {
  userId: string
  websiteId: string
}

export default class UserRepository extends Repository {
  constructor(db: Knex) {
    super(db, 'users');
  }

  async getAllUsers(opts?: PaginatedQueryOpts): Promise<PaginatedQuery<UserModel>> {
    const query = this.db<UsersTable>(this.table)
      .select('id', 'email', 'password', 'role', 'active');

    return new PaginatedQuery<UserModel>(this.db, query, opts);
  }

  async getUserById(id: string): Promise<UserModel | null> {
    const query = await this.db<UsersTable>(this.table)
      .first('email', 'password', 'role', 'active')
      .where({
        id
      });

    if (!query) return null;
    const { email, password, role, active } = query;
    return new UserModel(id, email, password, role, active);
  }

  async getUserByEmail(email: string): Promise<UserModel | null> {
    const query = await this.db<UsersTable>(this.table)
      .first('id', 'password', 'role', 'active')
      .where({
        email
      });

    if (!query) return null;
    const { id, password, role, active } = query;
    return new UserModel(id, email, password, role, active);
  }

  async create(user: UserModel) {
    await this.db<UsersTable>(this.table)
      .insert({
        id: user.getId(),
        email: user.getEmail(),
        password: user.getPasswordHash(),
        role: user.getRole(),
        active: user.isActive()
      });
  }

  async update(user: UserModel) {
    if (!(await this.exists(user.getId()))) {
      throw new NotFoundError('User not found');
    }

    const updateData: Partial<UsersTable> = {
      email: user.getEmail(),
      role: user.getRole(),
      active: user.isActive()
    };

    const passwordHash = user.getPasswordHash();
    if (passwordHash) {
      updateData.password = passwordHash;
    }

    await this.db<UsersTable>(this.table)
      .update(updateData)
      .where({
        id: user.getId()
      });
  }

  async delete(id: string) {
    if (!(await this.exists(id))) {
      throw new NotFoundError('User not found');
    }

    await this.db<UsersTable>(this.table)
      .where({
        id
      })
      .delete();
  }

  async getUserWebsites(id: string): Promise<string[]> {
    if (!(await this.exists(id))) {
      throw new NotFoundError('User not found');
    }

    const query = await this.db<UserWebsitesTable>('user_websites')
      .select('websiteId')
      .where({
        userId: id
      });

    return query.map((q) => q.websiteId);
  }

  async deleteUserWebsites(id: string, websites: string[]) {
    if (!(await this.exists(id))) {
      throw new NotFoundError('User not found');
    }

    await this.db<UserWebsitesTable>('user_websites')
      .whereIn(
        ['userId', 'websiteId'],
        websites.map((website) => [id, website])
      )
      .delete();
  }

  async addUserWebsites(id: string, websites: string[]) {
    if (!(await this.exists(id))) {
      throw new NotFoundError('User not found');
    }

    await this.db<UserWebsitesTable>('user_websites')
      .insert(
        websites.map((website) => ({
          userId: id,
          websiteId: website
        }))
      );
  }
}
