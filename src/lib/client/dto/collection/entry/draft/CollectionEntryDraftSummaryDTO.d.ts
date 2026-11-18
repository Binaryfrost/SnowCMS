export default class CollectionEntryDraftSummaryDTO {
  readonly id: string;
  readonly entryId: string | null;
  readonly collectionId: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly title: string | null;

  constructor(
    id: string,
    entryId: string | null,
    collectionId: string,
    createdAt: number,
    updatedAt: number,
    title: string | null
  );

  static fromJSON(json: any): CollectionEntryDraftSummaryDTO;
  clone(): CollectionEntryDraftSummaryDTO;
  toJSON(): {
    id: string
    entryId: string | null
    collectionId: string
    createdAt: number
    updatedAt: number
    title: string | null
  };
}
