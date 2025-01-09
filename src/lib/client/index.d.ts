import type { CollectionEntry } from './types/CollectionEntry';

export default class SnowCMSClient {
  constructor(url: string, websiteId: string, apiKey: string);

  getCollectionEntry<T extends CollectionEntry = CollectionEntry>
    (collection: string, entry: string): Promise<T[]>;

  getCollectionEntries<T extends CollectionEntry = CollectionEntry>
    (collection: string): Promise<T[]>;
}
