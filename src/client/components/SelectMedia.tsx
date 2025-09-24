import { useEffect, useReducer, useState } from 'react';
import { Box, Button } from '@mantine/core';
import { useDisclosure, useSetState } from '@mantine/hooks';
import { IconUpload } from '@tabler/icons-react';
import MediaGallery, { type MediaGalleryProps } from './MediaGallery';
import { getMediaConfig } from '../pages/media/Media';
import MediaUploadForm from './forms/MediaUploadForm';
import SearchInput from './SearchInput';
import { useIsMobile } from '../util/mobile';
import ConditionalFlexDirection from './ConditionalFlexDirection';
import { notifications } from '@mantine/notifications';

export type SelectMediaProps = Omit<MediaGalleryProps, 'refresh'>

export default function SelectMedia({ websiteId, mimeTypes, select }: SelectMediaProps) {
  /*
    We need a way to force the DataGetter to fetch the updated image list.
    Refreshing the page works fine for the media page but not for modals.
  */
  const [key, forceUpdate] = useReducer((x) => x + 1, 0);
  const [search, setSearch] = useState('');
  const [config, setConfig] = useSetState(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [mediaDisabled, setMediaDisabled] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    getMediaConfig(websiteId).then((m) => {
      if (!m) {
        setMediaDisabled(true);
        return;
      }

      setConfig(m);
    });
  }, []);

  return (
    <Box>
      {!mediaDisabled && (
        <ConditionalFlexDirection group={() => !isMobile} groupProps={{
          align: 'start'
        }} stackProps={{
          mb: 'xs',
          gap: 0
        }}>
          <Button leftSection={<IconUpload />} onClick={() => {
            if (!config) {
              notifications.show({
                message: 'Media features are disabled or config has not yet loaded. Please try again later.',
                color: 'yellow'
              });
              return;
            }
            open();
          }} mb="sm">Upload File</Button>
          <SearchInput setSearch={setSearch} />
        </ConditionalFlexDirection>
      )}

      {config && (
        <MediaUploadForm websiteId={websiteId} config={config}
          opened={opened} mimeTypes={mimeTypes} close={() => {
          close();
          forceUpdate();
        }} />
      )}

      <MediaGallery key={key} websiteId={websiteId} select={select}
        refresh={forceUpdate} search={search} mimeTypes={mimeTypes} />
    </Box>
  );
}
