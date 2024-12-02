import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, Checkbox, Group, Input as MantineInput, Paper, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useField } from '@mantine/form';
import { IconPhoto, IconPhotoOff } from '@tabler/icons-react';
import { type Input } from '../InputRegistry';
import type { MediaWithUrls } from '../types/Media';
import { SELECT_MEDIA_MODAL_ID, showSelectMediaModal } from '../../client/util/modals';
import FilePreview from '../../client/components/FilePreview';
import { get } from '../../client/util/api';

interface MediaInputSettings {
  required: boolean
}

const input: Input<string, MediaInputSettings> = {
  id: 'media',
  name: 'Media',

  serialize: (data) => data,
  deserialize: (data) => data,

  renderInput: () => forwardRef((props, ref) => {
    const { websiteId } = useParams();
    const [selectedImageId, setSelectedImageId] = useState(props.value);
    const [media, setMedia] = useState<MediaWithUrls>(null);
    const [error, setError] = useState(null);

    useImperativeHandle(ref, () => ({
      getValues: () => selectedImageId || '',
      hasError: () => {
        const hasError = props.settings?.required && !selectedImageId;
        if (hasError) {
          setError(`${props.name} is required`);
        }

        return hasError;
      }
    }));

    useEffect(() => {
      if (selectedImageId) {
        get<MediaWithUrls>(`/api/websites/${websiteId}/media/${props.value}`).then((resp) => {
          if (resp.status !== 200) {
            setError(resp.body.error || 'An error occurred');
            return;
          }

          setMedia(resp.body);
        });
      }
    }, []);

    return (
      <Box>
        <MantineInput.Label required={props.settings?.required}>{props.name}</MantineInput.Label>
        {props.description && (
          <MantineInput.Description>{props.description}</MantineInput.Description>
        )}
        <Paper bg="var(--mantine-color-default)" withBorder px="sm" py="xs">
          {selectedImageId && !media && !error ? (
            <FilePreview.Skeleton skeletonNum={1} />
          ) : (
            <>
              {error && <Text c="red">{error}</Text>}
              {media && (
                <Paper w="fit-content" withBorder mb="sm">
                  <Stack gap={0}>
                    <FilePreview file={media}>
                      <FilePreview.ViewButton file={media} />
                    </FilePreview>
                  </Stack>
                </Paper>
              )}

              <Group>
                <Button leftSection={<IconPhoto />} onClick={() => showSelectMediaModal({
                  websiteId,
                  select: (file) => {
                    setError(null);
                    setMedia(file);
                    setSelectedImageId(file.id);
                    modals.close(SELECT_MEDIA_MODAL_ID);
                  }
                })}>
                  Select Image
                </Button>
                {media && (
                  <Button leftSection={<IconPhotoOff />} onClick={() => {
                    setMedia(null);
                    setSelectedImageId(null);
                  }} color="orange">
                    Remove Selected Image
                  </Button>
                )}
              </Group>
            </>
          )}
        </Paper>
      </Box>
    );
  }),

  serializeSettings: (data) => JSON.stringify(data),
  deserializeSettings: (data) => JSON.parse(data),

  renderSettings: () => forwardRef((props, ref) => {
    const field = useField({
      mode: 'uncontrolled',
      type: 'checkbox',
      initialValue: props.settings?.required ?? true
    });

    useImperativeHandle(ref, () => ({
      getValues: () => ({
        required: field.getValue()
      }),
      hasError: async () => !!(await field.validate()),
    }));

    return (
      <Stack>
        <Checkbox label="Required" {...field.getInputProps()} key={field.key} />
      </Stack>
    );
  }),

  renderHtml: async (value, req) => {
    const { websiteId } = req.params;
    const { authorization } = req.headers;
    const port = req.socket.localPort;

    /*
      As this file is shared between the server and client, attempting to access the database
      directly breaks the build. To get around that, the server sends an HTTP request to itself
      with the user's auth token to get information about the image. It isn't ideal, but it works.
    */
    const resp = await fetch(`http://localhost:${port}/api/websites/${websiteId}/media/${value}`, {
      headers: {
        authorization
      }
    });

    const media: MediaWithUrls = await resp.json();
    return media.url;
  }
};

export default input;