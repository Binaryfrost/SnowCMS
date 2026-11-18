export default class CreateUpdateCollectionEntryDraftDTO {
  data: Record<string, string>;

  constructor(data: Record<string, string>);

  static fromJSON(json: any): CreateUpdateCollectionEntryDraftDTO;
  clone(): CreateUpdateCollectionEntryDraftDTO;
  toJSON(): {
    data: Record<string, string>
  };
}
