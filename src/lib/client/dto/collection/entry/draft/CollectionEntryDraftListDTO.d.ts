import CollectionEntryDraftSummaryDTO from './CollectionEntryDraftSummaryDTO';

export default class CollectionEntryDraftListDTO {
  readonly _metadata: {
    page: number
    pages: number
  };
  readonly drafts: CollectionEntryDraftSummaryDTO[];

  constructor(page: number, pages: number, drafts: CollectionEntryDraftSummaryDTO[]);

  static fromJSON(json: any): CollectionEntryDraftListDTO;
  clone(): CollectionEntryDraftListDTO;
  toJSON(): {
    _metadata: { page: number, pages: number }
    drafts: ReturnType<CollectionEntryDraftSummaryDTO['toJSON']>[]
  };
}
