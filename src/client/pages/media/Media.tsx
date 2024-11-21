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

export async function getMediaConfig(websiteId: string): Promise<MediaConfig> {
  const resp = await get<MediaConfig>(`/api/websites/${websiteId}/media/config`);

  if (resp.status !== 200) {
    notifications.show({
      message: `Failed to load media config: ${resp.body.error || 'An error occurred'}`
    });
    return null;
  }

  return resp.body;
}

export function Component() {
  const { websiteId } = useParams();
  const refresh = useRefresh();
  const [config, setConfig] = useState<MediaConfig>(null);
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    getMediaConfig(websiteId).then((m) => {
      if (!m) return;
      setConfig(m);
    });
  }, []);

  const storagePercentage = config ? (config.usedStorage / config.maxStorage) * 100 : 0;
  const warnPercentage = 90;
  const storageFull = config?.usedStorage >= config?.maxStorage;

  return (
    <Page title="Media">
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

      <Stack gap="sm">
        {!config ? (
          <GenericSkeleton skeletonNum={1} skeletonProps={{
            h: 32
          }} />
        ) : (
          <Box>
            <Progress value={storagePercentage} color={storagePercentage >= warnPercentage && 'red'} />
            <Group justify="space-between" gap={0}>
              <Text c="dimmed">
                <Tooltip label={`${config.usedStorage.toLocaleString()} bytes`}>
                  <Text inherit inline component="span">
                    Used: {bytesToReadableUnits(config.usedStorage)}
                  </Text>
                </Tooltip>
                {storagePercentage >= warnPercentage && ` (More than ${warnPercentage}% used)`}
              </Text>
              <Text c="dimmed">Maximum: {bytesToReadableUnits(config.maxStorage)}</Text>
            </Group>
          </Box>
        )}

        <MediaGallery websiteId={websiteId} refresh={refresh} />
      </Stack>

      {config && (
        <MediaUploadForm websiteId={websiteId} {...config} opened={opened} close={() => {
          close();
          setTimeout(() => {
            refresh();
          });
        }} />
      )}
    </Page>
  );
}
