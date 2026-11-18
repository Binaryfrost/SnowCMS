import type CollectionDTO from './CollectionDTO';

export default class CollectionListDTO {
  readonly _metadata: {
    page: number
    pages: number
  };
  readonly collections: CollectionDTO[];

  constructor(page: number, pages: number, collections: CollectionDTO[]);

  static fromJSON(json: any): CollectionListDTO;
  clone(): CollectionListDTO;
  toJSON(): {
    _metadata: { page: number, pages: number }
    collections: ReturnType<CollectionDTO['toJSON']>[]
  };
}
