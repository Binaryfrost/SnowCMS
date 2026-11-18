export default class ApiKeySecretDTO {
  readonly id: string;
  readonly key: string;
  readonly message: string | null;

  constructor(id: string, key: string, message?: string | null);

  static fromJSON(json: any): ApiKeySecretDTO;
  clone(): ApiKeySecretDTO;
  toJSON(): {
    id: string
    key: string
    message: string | null
  };
}
