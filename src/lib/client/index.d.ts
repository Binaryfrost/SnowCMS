import type { PaginatedQueryClient, PaginatedQueryOpts } from './PaginatedQueryClient';
import type { CollectionEntry, CollectionEntryWithData } from './types/CollectionEntry';

export default class SnowCMSClient {
  constructor(url: string, websiteId: string, apiKey: string);

  getCollectionEntry<T extends CollectionEntry = CollectionEntry>
    (collection: string, entry: string): Promise<T[]>;

  getCollectionEntries<T extends CollectionEntry = CollectionEntry>
    (collection: string, opts?: PaginatedQueryOpts): PaginatedQueryClient<T>;

  getCollectionEntriesData<T extends CollectionEntryWithData = CollectionEntryWithData>
    (entries: CollectionEntry[]): Promise<T[]>;
}
