import { useEffect, useReducer } from 'react';
import { Box, Button } from '@mantine/core';
import { useDisclosure, useSetState } from '@mantine/hooks';
import { IconUpload } from '@tabler/icons-react';
import MediaGallery, { type MediaGalleryProps } from './MediaGallery';
import { getMediaConfig } from '../pages/media/Media';
import MediaUploadForm from './forms/MediaUploadForm';

export type SelectMediaProps = Omit<MediaGalleryProps, 'refresh'>

export default function SelectMedia({ websiteId, select }: SelectMediaProps) {
  /*
    We need a way to force the DataGetter to fetch the updated image list.
    Refreshing the page works fine for the media page but not in modals.
  */
  const [key, forceUpdate] = useReducer((x) => x + 1, 0);
  const [config, setConfig] = useSetState(null);
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    getMediaConfig(websiteId).then((m) => {
      if (!m) return;
      setConfig(m);
    });
  }, []);

  return (
    <Box>
      <Button leftSection={<IconUpload />} onClick={open} mb="sm">Upload File</Button>
      {config && (
        <MediaUploadForm websiteId={websiteId} {...config} opened={opened} close={() => {
          close();
          forceUpdate();
        }} />
      )}

      <MediaGallery key={key} websiteId={websiteId} select={select} refresh={forceUpdate} />
    </Box>
  );
}
