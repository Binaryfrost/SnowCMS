import { LoadingOverlay } from '@mantine/core';
import { useEffect } from 'react';
import { get } from '../util/api';

export default function Logout() {
  useEffect(() => {
    get('/api/login/logout').then((resp) => {
      if (resp.status !== 200) {
        throw new Error(resp.body.error || 'An error occurred');
      }

      location.href = resp.body.redirect || '/login';
    }).catch(alert);
  }, []);

  return (
    <LoadingOverlay visible />
  );
}
