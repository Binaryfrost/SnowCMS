import WebsiteDTO from './WebsiteDTO';

export default class WebsiteListDTO {
  readonly _metadata: {
    page: number
    pages: number
  };
  readonly websites: WebsiteDTO[];

  constructor(page: number, pages: number, websites: WebsiteDTO[]);

  static fromJSON(json: any): WebsiteListDTO;
  clone(): WebsiteListDTO;
  toJSON(): {
    _metadata: { page: number, pages: number }
    websites: ReturnType<WebsiteDTO['toJSON']>[]
  };
}
