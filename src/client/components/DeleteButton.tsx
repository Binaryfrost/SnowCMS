import { ActionIcon } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import IconButton from './IconButton';
import { type DeleteModalOpts, showDeleteModal } from '../util/modals';
import type { Role } from '../../common/types/User';

interface Props extends DeleteModalOpts {
  keepTypeCase?: boolean
  role: Role
}

export default function DeleteButton(props: Props) {
  return (
    <IconButton label={`Delete ${props.type}`} role={props.role}>
      <ActionIcon color="red" onClick={() => showDeleteModal({
        id: props.id,
        url: props.url,
        type: props.keepTypeCase ? props.type : props.type.toLowerCase(),
        additional: props.additional,
        onDelete: props.onDelete
      })}>
        <IconTrash />
      </ActionIcon>
    </IconButton>
  );
}
