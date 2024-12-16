import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, Checkbox, Group, Input as MantineInput, Paper, Stack, TagsInput, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useForm } from '@mantine/form';
import { IconPhoto, IconPhotoOff } from '@tabler/icons-react';
import { type Input } from '../InputRegistry';
import type { MediaWithUrls } from '../types/Media';
import { SELECT_MEDIA_MODAL_ID, showSelectMediaModal } from '../../client/util/modals';
import FilePreview from '../../client/components/FilePreview';
import { get } from '../../client/util/api';
import { mimeTypeMatch } from '../util';
import ExpressError from '../ExpressError';
import { serverInputFetch } from '../plugins';

interface MediaInputSettings {
  mimeTypes: string[]
  required: boolean
}

const MIME_REGEX = /^[a-z]+\/(?:\*|[^*]+)$/;

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
                  mimeTypes: props.settings.mimeTypes,
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
    const form = useForm({
      mode: 'uncontrolled',
      initialValues: {
        mimeTypes: props.settings?.mimeTypes || [],
        required: props.settings?.required ?? true
      },
      validate: {
        mimeTypes: (values) => (!values.every((v) => v.match(MIME_REGEX)) ?
          'One or more mime types are invalid' : null)
      },
      validateInputOnChange: true
    });

    useImperativeHandle(ref, () => ({
      getValues: () => form.getValues(),
      hasError: () => form.validate().hasErrors
    }));

    return (
      <Stack>
        <TagsInput label="Mime Types" data={['image/*', 'image/png', 'image/jpeg']}
          description="Limit file selections by mime type" {...form.getInputProps('mimeTypes')}
          key={form.key('mimeTypes')} splitChars={[',', ' ']} />
        <Checkbox label="Required" {...form.getInputProps('required', { type: 'checkbox' })}
          key={form.key('required')} />
      </Stack>
    );
  }),

  validate: async (stringifiedValue, deserialize, settings, req) => {
    if (settings.required && !stringifiedValue) {
      throw new Error('Required Media Input does not have a value');
    }

    const value = deserialize(stringifiedValue);
    if (!value) return;
    if (settings.mimeTypes?.length === 0) return;

    const resp = await serverInputFetch(
      req,
      ({ websiteId }) => `/api/websites/${websiteId}/media/${value}`
    );

    if (resp.status !== 200) return;

    const media: MediaWithUrls = await resp.json();

    if (!settings.mimeTypes.some((type) => mimeTypeMatch(media.fileType, type))) {
      throw new ExpressError('Media Input image is an invalid type');
    }
  },

  validateSettings: (serializedSettings, deserialize) => {
    if (!serializedSettings) {
      throw new ExpressError('Settings are required');
    }

    const settings = deserialize(serializedSettings);

    if (settings.mimeTypes && !Array.isArray(settings.mimeTypes)) {
      throw new ExpressError('Mime Types must be an array');
    }

    if (!settings.mimeTypes?.every((v) => typeof v === 'string')) {
      throw new ExpressError('All mime type values must be strings');
    }

    if (!settings.mimeTypes?.every((v) => v.match(MIME_REGEX))) {
      throw new ExpressError('One or more mime types are invalid');
    }

    if (typeof settings.required !== 'boolean') {
      throw new ExpressError('Required must be a boolean');
    }
  },

  renderHtml: async (value, settings, req) => {
    if (!value) return null;

    const resp = await serverInputFetch(
      req,
      ({ websiteId }) => `/api/websites/${websiteId}/media/${value}`
    );

    if (resp.status !== 200) return null;

    const media: MediaWithUrls = await resp.json();
    return media.url;
  }
};

export default input;
