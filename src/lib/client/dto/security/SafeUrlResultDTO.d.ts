export default class SafeUrlResultDTO {
  readonly safe: boolean;
  readonly hostname: string | null;

  constructor(safe: boolean, hostname?: string | null);

  static fromJSON(json: any): SafeUrlResultDTO;
  clone(): SafeUrlResultDTO;
  toJSON(): {
    safe: boolean
    hostname: string | null
  };
}
