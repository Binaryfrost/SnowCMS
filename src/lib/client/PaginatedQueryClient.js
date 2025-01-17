const DEFAULT_OPTS = {
  page: 1,
  limit: 10,
  sort: 'asc',
  query: {}
};

/** @param {Record<string, string>} params */
function stringifyParams(params) {
  return Object.entries(params)
    .map(([key, value]) => (value ? `${key}=${value}` : null))
    .filter(Boolean)
    .join('&');
}

export class PaginatedQueryClient {
  /** @type {import('./BaseClient').default} */
  #client;
  /** @type {string} */
  #route;
  /** @type {import('./PaginatedQueryClient').PaginatedQueryOpts} */
  #opts;
  /** @type {number} */
  #pages;

  constructor(client, route, opts) {
    if (route.includes('?')) {
      throw new Error('Do not add query parameters to the route for paginated requests. ' +
        'Pass them in the opts instead');
    }

    this.#client = client;
    this.#route = route;
    this.#opts = {
      ...DEFAULT_OPTS,
      ...opts
    };
  }

  async fetch() {
    const { query, ...opts } = this.#opts;

    const params = {
      ...opts,
      ...query
    };

    /** @type {import('./types/PaginatedResponse').PaginatedResponse} */
    const resp = await this.#client.fetchFromCms(`${this.#route}?${stringifyParams(params)}`);

    this.#opts.page = resp.page;
    this.#pages = resp.pages;

    return resp.data;
  }

  get currentPage() {
    return this.#opts.page;
  }

  async getPages() {
    if (typeof this.#pages !== 'number') {
      await this.fetch();
    }

    return this.#pages;
  }

  async goToPage(page) {
    this.#opts.page = page;
    return this.fetch();
  }

  async prev() {
    if (this.#opts.page === 1) {
      throw new Error('Negative page numbers are not allowed');
    }

    return this.goToPage(this.#opts.page - 1);
  }

  async next() {
    return this.goToPage(this.#opts.page + 1);
  }
}
