import CollectionEntryDTO from './CollectionEntryDTO';

export default class CollectionEntryWithRenderedDataDTO extends CollectionEntryDTO {
  readonly data: Record<string, any>;

  constructor(
    id: string,
    collectionId: string,
    createdAt: number,
    updatedAt: number,
    data: Record<string, any>
  );

  static fromJSON(json: any): CollectionEntryWithRenderedDataDTO;
  clone(): CollectionEntryWithRenderedDataDTO;
  toJSON(): {
    id: string
    collectionId: string
    createdAt: number
    updatedAt: number
    data: Record<string, any>
  };
}
