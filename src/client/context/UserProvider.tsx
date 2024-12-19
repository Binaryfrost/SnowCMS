import { useEffect, useState, type ReactNode } from 'react';
import { LoadingOverlay } from '@mantine/core';
import { UserContext } from './UserContext';
import { UserWithWebsites } from '../../common/types/User';
import { get } from '../util/api';

interface Props {
  children: ReactNode
}

export default function UserProvider({ children }: Props) {
  const [user, setUser] = useState<UserWithWebsites>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);

    try {
      const resp = await get<UserWithWebsites>('/api/accounts/me', {
        noRedirectOn401: true
      });
      if (resp.status !== 200) {
        throw new Error(resp.body.error || 'An error occurred');
      }

      setUser(resp.body);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    <UserContext.Provider value={{
      user,
      refresh,
    }}>
      {loading ? (
        <LoadingOverlay visible />
      ) : children}
    </UserContext.Provider>
  );
}
