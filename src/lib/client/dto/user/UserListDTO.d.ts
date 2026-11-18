import type UserDTO from './UserDTO';

export default class UserListDTO {
  readonly _metadata: {
    page: number
    pages: number
  };
  readonly users: UserDTO[];

  constructor(page: number, pages: number, users: UserDTO[]);

  static fromJSON(json: any): UserListDTO;
  clone(): UserListDTO;
  toJSON(): {
    _metadata: { page: number, pages: number }
    users: ReturnType<UserDTO['toJSON']>[]
  };
}
