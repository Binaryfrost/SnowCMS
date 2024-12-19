import { createContext } from 'react';
import { UserWithWebsites } from '../../common/types/User';

interface UserContextType {
  user: UserWithWebsites
  refresh: () => void
}

export const UserContext = createContext<UserContextType>(null);
