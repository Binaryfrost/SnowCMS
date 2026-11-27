export default class CollectionDTO {
  get id(): string;
  get websiteId(): string;
  get name(): string;
  set name(value: string);
  get callHook(): boolean;
  set callHook(value: boolean);
  get title(): string | null;
  set title(value: string | null);
  get slug(): string | null;
  set slug(value: string | null);
  get backdatingEnabled(): boolean;
  set backdatingEnabled(value: boolean);

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
