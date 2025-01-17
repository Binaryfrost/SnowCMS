import BaseClient from './BaseClient.js';
import { PaginatedQueryClient } from './PaginatedQueryClient.js';

export default class SnowCMSClient extends BaseClient {
  async getCollectionEntry(collection, entry) {
    return this.fetchFromCms(`/collections/${collection}/entries/${entry}?render=true`);
  }

  getCollectionEntries(collection, opts) {
    return new PaginatedQueryClient(
      this,
      `/collections/${collection}/entries`,
      opts
    );
  }

  getCollectionEntriesData(entries) {
    if (entries.length === 0) return [];

    const collection = entries[0].collectionId;
    return Promise.all(entries.map((e) => this.getCollectionEntry(collection, e.id)));
  }
}
