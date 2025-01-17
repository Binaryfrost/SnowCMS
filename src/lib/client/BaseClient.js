export default class BaseClient {
  #url;
  #website;
  #apiKey;

  constructor(url, websiteId, apiKey) {
    this.#url = url;
    this.#website = websiteId;
    this.#apiKey = apiKey;
  }

  async fetchFromCms(path) {
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
}
