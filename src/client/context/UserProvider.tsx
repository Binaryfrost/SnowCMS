import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  async function refresh() {
    setLoading(true);

    try {
      const resp = await get<UserWithWebsites>('/api/accounts/me');
      if (resp.status === 200) {
        setUser(resp.body);
      } else {
        navigate('/login');
      }
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
      {loading || !user ? (
        <LoadingOverlay visible />
      ) : children}
    </UserContext.Provider>
  );
}
