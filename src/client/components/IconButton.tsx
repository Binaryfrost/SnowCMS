import { Tooltip } from '@mantine/core';
import { ReactNode, useContext } from 'react';
import type { Role } from '../../common/types/User';
import { hasAccess } from '../../common/users';
import { UserContext } from '../context/UserContext';

export interface IconButtonProps {
  label: string
  children: ReactNode
  role?: Role
}

function IconButtonWithContext({ role, children }: Omit<IconButtonProps, 'label'>) {
  const { user } = useContext(UserContext);

  if (role) {
    if (!user) return null;
    if (!hasAccess(user, role)) return null;
  }

  return children;
}

export default function IconButton({ label, children, role }: IconButtonProps) {
  const tooltip = (
    <Tooltip label={label}>
      {children}
    </Tooltip>
  );

  return role ? (
    <IconButtonWithContext role={role}>
      {tooltip}
    </IconButtonWithContext>
  ) : tooltip;
}
