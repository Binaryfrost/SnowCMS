import { ActionIcon } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import IconButton from './IconButton';
import { showDeleteModal } from '../util/modals';
import type { Role } from '../../common/types/User';

interface Props {
  type: string
  keepTypeCase?: boolean
  role: Role
  id: string
  url: string
  onDelete: () => void
}

export default function DeleteButton(props: Props) {
  return (
    <IconButton label={`Delete ${props.type}`} role={props.role} desktopOnlyTooltip>
      <ActionIcon color="red" onClick={() => showDeleteModal({
        id: props.id,
        url: props.url,
        type: props.keepTypeCase ? props.type : props.type.toLowerCase(),
        onDelete: props.onDelete
      })}>
        <IconTrash />
      </ActionIcon>
    </IconButton>
  );
}
