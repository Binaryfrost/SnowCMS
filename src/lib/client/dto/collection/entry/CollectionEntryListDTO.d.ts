import CollectionEntryWithMetadataDTO from './CollectionEntryWithMetadataDTO';

export default class CollectionEntryListDTO {
  readonly _metadata: {
    page: number
    pages: number
  };
  readonly entries: CollectionEntryWithMetadataDTO[];

  constructor(page: number, pages: number, entries: CollectionEntryWithMetadataDTO[]);

  static fromJSON(json: any): CollectionEntryListDTO;
  clone(): CollectionEntryListDTO;
  toJSON(): {
    _metadata: { page: number, pages: number }
    entries: ReturnType<CollectionEntryWithMetadataDTO['toJSON']>[]
  };
}
