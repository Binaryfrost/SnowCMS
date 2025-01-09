/** @type {import('.').SnowCMSClient} */
export class SnowCMSClient {
  #url;
  #website;
  #apiKey;

  constructor(url, websiteId, apiKey) {
    this.#url = url;
    this.#website = websiteId;
    this.#apiKey = apiKey;
  }

  async #fetchFromCms(path) {
    const reqUrl = `${this.#url}/api/websites/${this.#website}${path}`;

    const resp = await fetch(reqUrl, {
      headers: {
        Authorization: `Bearer ${this.#apiKey}`
      }
    });

    const body = await resp.json();

    if (resp.status !== 200) {
      throw new Error(`Failed to fetch data from CMS: ${body.error}`);
    }

    return body;
  }

  async getCollectionEntry(collection, entry) {
    return this.#fetchFromCms(`/collections/${collection}/entries/${entry}?render=true`);
  }

  async getCollectionEntries(collection) {
    const entries = await Promise.all((
      await this.#fetchFromCms(`/collections/${collection}/entries`)
    )
      .map((/** @type {import('./types/Collection').Collection} */ e) => this.getCollectionEntry(
        collection, e.id
      ))
    );

    return entries;
  }
}
