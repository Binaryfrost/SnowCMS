export default class CreateUpdateWebsiteDTO {
  name: string;
  hook: string | null;

  constructor(name: string, hook?: string | null);

  static fromJSON(json: any): CreateUpdateWebsiteDTO;
  clone(): CreateUpdateWebsiteDTO;
  toJSON(): {
    name: string
    hook: string | null
  };
}
