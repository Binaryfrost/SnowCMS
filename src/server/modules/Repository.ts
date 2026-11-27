import { Knex } from 'knex';
import MvcObject from './MvcObject';

export default class Repository extends MvcObject {
  protected db: Knex;
  protected table: string;

  constructor(db: Knex, table: string) {
    super();
    this.db = db;
    this.table = table;
  }

  async exists(id: string, idColumn: string = 'id', table: string = this.table) {
    const result = await this.db(table)
      .select(idColumn)
      .where({
        id
      });
    return result.length > 0;
  }

  withTransaction(trx: Knex.Transaction) {
    const Ctor = this.constructor as new (db: Knex, table: string) => this;
    return new Ctor(trx, this.table);
  }
}
