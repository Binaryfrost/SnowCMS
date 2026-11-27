import CollectionEntryDTO from './CollectionEntryDTO';
import CollectionEntryInputDTO from './CollectionEntryInputDTO';

export default class CollectionEntryWithDataDTO extends CollectionEntryDTO {
  get data(): CollectionEntryInputDTO[];
  set data(value: CollectionEntryInputDTO[]);

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
