export default class CreateUpdateCollectionEntryDTO {
  data: Record<string, string>;

  constructor(data: Record<string, string>);

  static fromJSON(json: any): CreateUpdateCollectionEntryDTO;
  clone(): CreateUpdateCollectionEntryDTO;
  toJSON(): {
    data: Record<string, string>
  };
}
