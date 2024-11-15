import { ActionIcon } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import IconButton from './IconButton';

export default function GlobalSettingsButton() {
  return (
    <IconButton label="CMS Settings" role="ADMIN">
      <ActionIcon size="lg" component={Link} to="/settings">
        <IconSettings />
      </ActionIcon>
    </IconButton>
  );
}
