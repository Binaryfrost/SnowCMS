import { ActionIcon } from '@mantine/core';
import { IconHelp } from '@tabler/icons-react';
import IconButton from './IconButton';

export default function LogoutButton() {
  return (
    <IconButton label="Help">
      <ActionIcon size="lg" component="a" href="https://cms-docs.binaryfrost.net" target="_blank">
        <IconHelp />
      </ActionIcon>
    </IconButton>
  );
}
