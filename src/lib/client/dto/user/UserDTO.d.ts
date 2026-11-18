export type UserRole = 'VIEWER' | 'USER' | 'SUPERUSER' | 'ADMIN';

export default class UserDTO {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
  readonly active: boolean;
  readonly websites: string[];

  constructor(id: string, email: string, role: UserRole, active: boolean, websites: string[]);

  static fromJSON(json: any): UserDTO;
  clone(): UserDTO;
  toJSON(): {
    id: string
    email: string
    role: UserRole
    active: boolean
    websites: string[]
  };
}
