import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import ShortUuid, { shortenUuid } from '../components/ShortUuid';
import { del } from './api';

interface DeleteModalOpts {
  url: string
  id: string
  type: string
  onDelete: () => void
}

export function showDeleteModal(opts: DeleteModalOpts) {
  modals.openConfirmModal({
    title: `Delete ${opts.type}`,
    children: (
      <>
        <Text>Are you sure you want to delete {opts.type} with ID&nbsp;
          <ShortUuid uuid={opts.id} />?</Text>
        <Text c="dimmed">This action is irreversible.</Text>
      </>
    ),
    cancelProps: {
      children: 'Cancel'
    },
    confirmProps: {
      color: 'red',
      children: 'Delete'
    },
    onConfirm: () => {
      del(opts.url).then((resp) => {
        if (resp.status !== 200) {
          throw new Error(resp.body.error);
        }

        notifications.show({
          message: `Deleted ${opts.type} with ID ${shortenUuid(opts.id)}`
        });
        opts.onDelete();
      }).catch((err) => {
        notifications.show({
          message: `Failed to delete ${opts.type} with ID ${shortenUuid(opts.id)}: ${err.message || 'An error occurred'}`,
          color: 'red'
        });
      });
    }
  });
}
