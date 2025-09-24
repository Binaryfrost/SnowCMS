import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Group, Progress, Stack, Text, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { IconUpload } from '@tabler/icons-react';
import HeaderWithAddButton from '../../components/HeaderWithAddButton';
import Page from '../../components/Page';
import type { MediaConfig } from '../../../common/types/Media';
import { get } from '../../util/api';
import GenericSkeleton from '../../components/GenericSkeleton';
import { bytesToReadableUnits } from '../../util/media';
import MediaGallery from '../../components/MediaGallery';
import MediaUploadForm from '../../components/forms/MediaUploadForm';
import useRefresh from '../../util/refresh';
import SearchInput from '../../components/SearchInput';
import MediaStorageUsage from '../../components/MediaStorageUsage';

export async function getMediaConfig(websiteId: string): Promise<MediaConfig> {
  const resp = await get<MediaConfig>(`/api/websites/${websiteId}/media/config`);

  if (resp.status !== 200) {
    notifications.show({
      message: `Failed to load media config: ${resp.body.error || 'An error occurred'}`,
      color: 'red'
    });
    return null;
  }

  return resp.body;
}

export function Component() {
  const { websiteId } = useParams();
  const refresh = useRefresh();
  const [search, setSearch] = useState('');
  const [config, setConfig] = useState<MediaConfig>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [mediaDisabled, setMediaDisabled] = useState(false);

  useEffect(() => {
    getMediaConfig(websiteId).then((m) => {
      if (!m) {
        setMediaDisabled(true);
        return;
      }

      setConfig(m);
    });
  }, []);

  const storagePercentage = config ? (config.usedStorage / config.maxStorage) * 100 : 0;
  const warnPercentage = 90;
  const storageFull = config?.usedStorage >= config?.maxStorage;

  return (
    <Page title="Media">
      <Group justify="space-between" mb="sm">
        <HeaderWithAddButton tooltipLabel={storageFull ? 'Storage Full' : 'Upload Media'}
          titleProps={{
            children: 'Media'
          }} actionIconProps={{
            children: <IconUpload />,
            disabled: !config || storageFull,
            onClick: open
          }} iconButtonProps={{
            role: 'USER'
          }} />
        {!mediaDisabled && <SearchInput setSearch={setSearch} />}
      </Group>

      <Stack gap="sm">
        {!mediaDisabled && <MediaStorageUsage config={config} />}
        <MediaGallery websiteId={websiteId} refresh={refresh} search={search} />
      </Stack>

      {config && (
        <MediaUploadForm websiteId={websiteId} config={config} opened={opened} close={() => {
          close();
          setTimeout(() => {
            refresh();
          });
        }} />
      )}
    </Page>
  );
}
