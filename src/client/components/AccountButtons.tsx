import { useContext } from 'react';
import { ActionIcon } from '@mantine/core';
import { IconUser, IconUsers } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import IconButton from './IconButton';
import { UserContext } from '../context/UserContext';

export function MyAccountButton() {
  const { user } = useContext(UserContext);

  return (
    <IconButton label="My Account" role="USER">
      <ActionIcon size="lg" component={Link} to={`/accounts/${user.id}/settings`}>
        <IconUser />
      </ActionIcon>
    </IconButton>
  );
}

export function AccountsButton() {
  return (
    <IconButton label="Accounts" role="ADMIN">
      <ActionIcon size="lg" component={Link} to="/accounts">
        <IconUsers />
      </ActionIcon>
    </IconButton>
  );
}
