export default class BaseClient {
  constructor(url: string, websiteId: string, apiKey: string);

  fetchFromCms<T>(path: string): Promise<T>;
}
