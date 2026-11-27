import { createContext } from 'react';
import type UserDTO from '../../lib/client/dto/user/UserDTO';

interface UserContextType {
  user: UserDTO
  refresh: () => void
}

export const UserContext = createContext<UserContextType>(null);
