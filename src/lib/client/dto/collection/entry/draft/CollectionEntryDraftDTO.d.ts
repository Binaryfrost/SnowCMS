export default class CollectionEntryDraftDTO {
  get id(): string;
  get entryId(): string | null;
  set entryId(value: string | null);
  get collectionId(): string;
  get createdAt(): number;
  get updatedAt(): number;
  get data(): Record<string, string>;
  set data(value: Record<string, string>);

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
