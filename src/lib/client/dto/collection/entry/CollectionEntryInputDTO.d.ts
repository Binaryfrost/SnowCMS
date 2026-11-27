export default class CollectionEntryInputDTO {
  get entryId(): string | null;
  get inputId(): string;
  get data(): string | null;
  set data(value: string | null);

  constructor(entryId: string | null, inputId: string, data: string | null);

  static fromJSON(json: any): CollectionEntryInputDTO;
  clone(): CollectionEntryInputDTO;
  toJSON(): {
    entryId: string | null
    inputId: string
    data: string | null
  };
}
