import type UserDTO from './UserDTO';

export default class UpdateUserDTO {
  email: string;
  role: UserDTO['role'];
  password: string | null;
  active: boolean;
  websites: string[];

  constructor(
    email: string,
    role: UserDTO['role'],
    password: string | null,
    active: boolean,
    websites: string[]
  );

  static fromJSON(json: any): UpdateUserDTO;
  clone(): UpdateUserDTO;
  toJSON(): {
    email: string
    role: UserDTO['role']
    password: string | null
    active: boolean
    websites: string[]
  };
}
