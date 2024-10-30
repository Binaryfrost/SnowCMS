import { Tooltip } from '@mantine/core';
import { ReactNode } from 'react';
import type { Role } from '../../common/types/User';
import { getUser } from '../util/api';
import { hasAccess } from '../../common/users';

export interface IconButtonProps {
  label: string
  children: ReactNode
  desktopOnlyTooltip?: boolean
  role?: Role
}

export default function IconButton({ label, children, role, desktopOnlyTooltip }: IconButtonProps) {
  const user = getUser();

  if (role) {
    if (!user) return null;
    if (!hasAccess(user, role)) return null;
  }

  return (
    <Tooltip label={label} events={desktopOnlyTooltip ? {
      hover: true,
      touch: false,
      focus: false
    } : undefined}>
      {children}
    </Tooltip>
  );
}
