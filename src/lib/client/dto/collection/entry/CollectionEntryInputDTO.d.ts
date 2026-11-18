export default class CollectionEntryInputDTO {
  readonly entryId: string | null;
  readonly inputId: string;
  readonly data: string | null;

  constructor(entryId: string | null, inputId: string, data: string | null);

  static fromJSON(json: any): CollectionEntryInputDTO;
  clone(): CollectionEntryInputDTO;
  toJSON(): {
    entryId: string | null
    inputId: string
    data: string | null
  };
}
