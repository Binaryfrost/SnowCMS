import MediaWithUrlsDTO from './MediaWithUrlsDTO';

export default class MediaListDTO {
  readonly _metadata: {
    page: number
    pages: number
  };
  readonly media: MediaWithUrlsDTO[];

  constructor(page: number, pages: number, media: MediaWithUrlsDTO[]);

  static fromJSON(json: any): MediaListDTO;
  clone(): MediaListDTO;
  toJSON(): {
    _metadata: { page: number, pages: number }
    media: ReturnType<MediaWithUrlsDTO['toJSON']>[]
  };
}
