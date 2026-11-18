export default class WebsiteDTO {
  readonly id: string;
  readonly name: string;
  readonly hook: string | null;

  constructor(id: string, name: string, hook?: string | null);

  static fromJSON(json: any): WebsiteDTO;
  clone(): WebsiteDTO;
  toJSON(): {
    id: string
    name: string
    hook: string | null
  };
}
