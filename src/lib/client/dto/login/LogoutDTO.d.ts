export default class LogoutDTO {
  readonly redirect: string;

  constructor(redirect: string);

  static fromJSON(json: any): LogoutDTO;
  clone(): LogoutDTO;
  toJSON(): {
    redirect: string
  };
}
