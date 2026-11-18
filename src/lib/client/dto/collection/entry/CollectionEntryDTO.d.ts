export default class CollectionEntryDTO {
  readonly id: string;
  readonly collectionId: string;
  readonly createdAt: number;
  readonly updatedAt: number;

  constructor(id: string, collectionId: string, createdAt: number, updatedAt: number);

  static fromJSON(json: any): CollectionEntryDTO;
  clone(): CollectionEntryDTO;
  toJSON(): {
    id: string
    collectionId: string
    createdAt: number
    updatedAt: number
  };
}
