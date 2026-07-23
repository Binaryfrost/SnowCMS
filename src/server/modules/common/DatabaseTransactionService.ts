import { Knex } from 'knex';
import Service from '../Service';

export default class DatabaseTransactionService extends Service {
  private db: Knex;

  constructor(db: Knex) {
    super();
    this.db = db;
  }

  async run<T>(callback: (trx: Knex.Transaction) => Promise<T>) {
    return this.db.transaction(callback);
  }
}
