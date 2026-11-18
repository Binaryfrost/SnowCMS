import CollectionEntryDTO from './CollectionEntryDTO';
import CollectionEntryInputDTO from './CollectionEntryInputDTO';

export default class CollectionEntryWithDataDTO extends CollectionEntryDTO {
  readonly data: CollectionEntryInputDTO[];

  constructor(
    id: string,
    collectionId: string,
    createdAt: number,
    updatedAt: number,
    data: CollectionEntryInputDTO[]
  );

  static fromJSON(json: any): CollectionEntryWithDataDTO;
  clone(): CollectionEntryWithDataDTO;
  toJSON(): {
    id: string
    collectionId: string
    createdAt: number
    updatedAt: number
    data: ReturnType<CollectionEntryInputDTO['toJSON']>[]
  };
}
