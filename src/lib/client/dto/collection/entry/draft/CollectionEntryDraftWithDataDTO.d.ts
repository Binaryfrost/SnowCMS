import CollectionEntryInputDTO from '../CollectionEntryInputDTO';

export default class CollectionEntryDraftWithDataDTO {
  readonly id: string;
  readonly entryId: string | null;
  readonly collectionId: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly data: CollectionEntryInputDTO[];

  constructor(
    id: string,
    entryId: string | null,
    collectionId: string,
    createdAt: number,
    updatedAt: number,
    data: CollectionEntryInputDTO[]
  );

  static fromJSON(json: any): CollectionEntryDraftWithDataDTO;
  clone(): CollectionEntryDraftWithDataDTO;
  toJSON(): {
    id: string
    entryId: string | null
    collectionId: string
    createdAt: number
    updatedAt: number
    data: ReturnType<CollectionEntryInputDTO['toJSON']>[]
  };
}
