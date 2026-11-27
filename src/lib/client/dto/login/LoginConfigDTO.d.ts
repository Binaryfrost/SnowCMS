export class SsoLoginConfigDTO {
  readonly enabled: boolean;
  readonly forced: boolean;
  readonly text: string;

  constructor(enabled: boolean, forced: boolean, text: string);

  static fromJSON(json: any): SsoLoginConfigDTO;
  clone(): SsoLoginConfigDTO;
  toJSON(): {
    enabled: boolean
    forced: boolean
    text: string
  };
}

export default class LoginConfigDTO {
  readonly sso: SsoLoginConfigDTO | null;
  readonly smtp: boolean;

  constructor(sso: SsoLoginConfigDTO | null, smtp: boolean);

  static fromJSON(json: any): LoginConfigDTO;
  clone(): LoginConfigDTO;
  toJSON(): {
    sso: ReturnType<SsoLoginConfigDTO['toJSON']> | null
    smtp: boolean
  };
}
