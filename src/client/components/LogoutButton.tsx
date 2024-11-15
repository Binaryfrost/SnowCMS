import { ActionIcon } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import IconButton from './IconButton';

export default function LogoutButton() {
  return (
    <IconButton label="Logout">
      <ActionIcon size="lg" component={Link} to="/logout">
        <IconLogout />
      </ActionIcon>
    </IconButton>
  );
}
