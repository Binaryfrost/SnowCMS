import type UserDTO from './UserDTO';

export default class CreateUserDTO {
  email: string;
  role: UserDTO['role'];
  password: string;
  active: boolean;
  websites: string[];

  constructor(
    email: string,
    role: UserDTO['role'],
    password: string,
    active: boolean,
    websites: string[]
  );

  static fromJSON(json: any): CreateUserDTO;
  clone(): CreateUserDTO;
  toJSON(): {
    email: string
    role: UserDTO['role']
    password: string
    active: boolean
    websites: string[]
  };
}
