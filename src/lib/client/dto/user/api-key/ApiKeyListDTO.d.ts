import type ApiKeyDTO from './ApiKeyDTO';

export default class ApiKeyListDTO {
  readonly _metadata: {
    page: number
    pages: number
  };
  readonly apiKeys: ApiKeyDTO[];

  constructor(page: number, pages: number, apiKeys: ApiKeyDTO[]);

  static fromJSON(json: any): ApiKeyListDTO;
  clone(): ApiKeyListDTO;
  toJSON(): {
    _metadata: { page: number, pages: number }
    apiKeys: ReturnType<ApiKeyDTO['toJSON']>[]
  };
}
