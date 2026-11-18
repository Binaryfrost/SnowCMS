export default class CollectionEntryDraftDTO {
  readonly id: string;
  readonly entryId: string | null;
  readonly collectionId: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly data: Record<string, string>;

  constructor(
    id: string,
    entryId: string | null,
    collectionId: string,
    createdAt: number,
    updatedAt: number,
    data: Record<string, string>
  );

  static fromJSON(json: any): CollectionEntryDraftDTO;
  clone(): CollectionEntryDraftDTO;
  toJSON(): {
    id: string
    entryId: string | null
    collectionId: string
    createdAt: number
    updatedAt: number
    data: Record<string, string>
  };
}
