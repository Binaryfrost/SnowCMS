import SnowCMSClient from '../../src/lib/client/index';
import type CollectionEntry from '../../src/lib/client/types/CollectionEntry.d.ts';

import { CMS_API, CMS_API_KEY, CMS_WEBSITE, CMS_COLLECTION } from 'astro:env/server';

const client = new SnowCMSClient(CMS_API, CMS_WEBSITE, CMS_API_KEY);

export async function getAllEntries() {
  const paginatedQueryClient = client.getCollectionEntries(CMS_COLLECTION);
  const pages = await paginatedQueryClient.getPages();
  const entries = [];

  for (let page = 1; page <= pages; page++) {
    entries.push(await paginatedQueryClient.goToPage(page));
  }

  return entries.flat();
}

export async function getEntryData(id: string) {
  return client.getCollectionEntry(CMS_COLLECTION, id) as Promise<CollectionEntry.CollectionEntryWithRenderedData>;
}

export { type CollectionEntry }
