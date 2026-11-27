export default class CreateCollectionDTO {
  name: string;
  callHook: boolean;

  constructor(name: string, callHook: boolean);

  static fromJSON(json: any): CreateCollectionDTO;
  clone(): CreateCollectionDTO;
  toJSON(): {
    name: string
    callHook: boolean
  };
}
