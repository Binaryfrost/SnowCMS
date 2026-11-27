export default class UpdateCollectionDTO {
  name: string;
  callHook: boolean;
  title: string;
  slug: string | null;
  backdatingEnabled: boolean;

  constructor(
    name: string,
    callHook: boolean,
    title: string,
    slug: string | null,
    backdatingEnabled: boolean
  );

  static fromJSON(json: any): UpdateCollectionDTO;
  clone(): UpdateCollectionDTO;
  toJSON(): {
    name: string
    callHook: boolean
    title: string
    slug: string | null
    backdatingEnabled: boolean
  };
}
