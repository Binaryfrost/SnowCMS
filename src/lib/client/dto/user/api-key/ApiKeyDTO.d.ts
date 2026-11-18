import type UserDTO from '../UserDTO';

export default class ApiKeyDTO {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly role: UserDTO['role'];
  readonly active: boolean;
  readonly websites: string[];

  constructor(
    id: string,
    userId: string,
    name: string,
    role: UserDTO['role'],
    active: boolean,
    websites: string[]
  );

  static fromJSON(json: any): ApiKeyDTO;
  clone(): ApiKeyDTO;
  toJSON(): {
    id: string
    userId: string
    name: string
    role: UserDTO['role']
    active: boolean
    websites: string[]
  };
}
