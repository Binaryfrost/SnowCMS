import type UserDTO from '../UserDTO';

export default class CreateUpdateApiKeyDTO {
  name: string;
  role: UserDTO['role'];
  active: boolean;
  websites: string[];

  constructor(name: string, role: UserDTO['role'], active: boolean, websites: string[]);

  static fromJSON(json: any): CreateUpdateApiKeyDTO;
  clone(): CreateUpdateApiKeyDTO;
  toJSON(): {
    name: string
    role: UserDTO['role']
    active: boolean
    websites: string[]
  };
}
