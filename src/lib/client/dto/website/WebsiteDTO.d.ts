export default class WebsiteDTO {
  get id(): string;
  get name(): string;
  set name(value: string);
  get hook(): string | null;
  set hook(value: string | null);

  constructor(id: string, name: string, hook?: string | null);

  static fromJSON(json: any): WebsiteDTO;
  clone(): WebsiteDTO;
  toJSON(): {
    id: string
    name: string
    hook: string | null
  };
}
