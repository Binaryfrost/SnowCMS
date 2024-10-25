export type Role = 'ADMIN' | 'SUPERUSER' | 'USER' | 'VIEWER';

export interface User {
  role: Role
  websites: string[]
}
