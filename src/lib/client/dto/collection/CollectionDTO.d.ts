export default class CollectionDTO {
  readonly id: string;
  readonly websiteId: string;
  readonly name: string;
  readonly callHook: boolean;
  readonly title: string | null;
  readonly slug: string | null;
  readonly backdatingEnabled: boolean;

  constructor(
    id: string,
    websiteId: string,
    name: string,
    callHook: boolean,
    title: string | null,
    slug: string | null,
    backdatingEnabled: boolean
  );

  static fromJSON(json: any): CollectionDTO;
  clone(): CollectionDTO;
  toJSON(): {
    id: string
    websiteId: string
    name: string
    callHook: boolean
    title: string | null
    slug: string | null
    backdatingEnabled: boolean
  };
}
