import { ActionIcon } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import ButtonTooltip from './ButtonTooltip';

export default function LogoutButton() {
  return (
    <ButtonTooltip label="Logout">
      <ActionIcon size="lg">
        <IconLogout />
      </ActionIcon>
    </ButtonTooltip>
  );
}
