import { ROLE_HIERARCHY } from '../users';

export type Role = keyof typeof ROLE_HIERARCHY;

export interface User {
  id: string
  email: string
  role: Role
  active: boolean
}

export interface DatabaseUser extends User {
  password: string
}

export interface UserWebsite {
  userId: string
  websiteId: string
}

export interface UserWithWebsites extends User {
  websites: string[]
}

export interface ApiKey {
  id: string
  userId: string
  name: string
  role: Role
  active: boolean
}

export interface DatabaseApiKey extends ApiKey {
  key: string
}

export interface ApiKeyWebsite {
  apikeyId: string
  websiteId: string
}

export interface ApiKeyWithWebsites extends ApiKey {
  websites: string[]
}

export interface LoginConfig {
  sso: {
    enabled: boolean
    forced: boolean
  }
}
