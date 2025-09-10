import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Button, Checkbox, Group, Input as MantineInput, Paper, Stack, TagsInput, Text
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconPhoto, IconPhotoOff } from '@tabler/icons-react';
import { type Input } from '../InputRegistry';
import type { MediaWithUrls } from '../types/Media';
import { SELECT_MEDIA_MODAL_ID, showSelectMediaModal } from '../../client/util/modals';
import FilePreview from '../../client/components/FilePreview';
import { get } from '../../client/util/api';
import { mimeTypeMatch } from '../util';
import ExpressError from '../ExpressError';
import { serverInputFetch } from '../plugins/plugins';
import { useInputValidator, useSettingsHandler } from './hooks';

interface MediaInputSettings {
  mimeTypes: string[]
}

const MIME_REGEX = /^[a-z]+\/(?:\*|[^*]+)$/;

const input: Input<string, MediaInputSettings> = {
  id: 'media',
  name: 'Media',

  serialize: (data) => data,
  deserialize: (data) => data,

  renderInput: ({
    name, description, value, required, settings, onChange, registerValidator, unregisterValidator
  }) => {
    const { websiteId } = useParams();
    const [media, setMedia] = useState<MediaWithUrls>(null);
    const [mediaError, setMediaError] = useState(null);

    const error = useInputValidator(
      (v) => {
        if (required && !v) {
          return `${name} is required`;
        }
      },
      registerValidator,
      unregisterValidator
    );

    useEffect(() => {
      if (value) {
        get<MediaWithUrls>(`/api/websites/${websiteId}/media/${value}`).then((resp) => {
          if (resp.status !== 200) {
            setMediaError(resp.body.error || 'An error occurred');
            return;
          }

          setMedia(resp.body);
        });
      }
    }, []);

    const err = error || mediaError;

    return (
      <Box>
        <MantineInput.Label required={required}>{name}</MantineInput.Label>
        {description && (
          <MantineInput.Description>{description}</MantineInput.Description>
        )}
        <Paper bg="var(--mantine-color-default)" withBorder px="sm" py="xs">
          {value && !media && !err ? (
            <FilePreview.Skeleton skeletonNum={1} />
          ) : (
            <>
              {err && <Text c="red">{err}</Text>}
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
                  mimeTypes: settings.mimeTypes,
                  select: (file) => {
                    setMediaError(null);
                    setMedia(file);
                    onChange(file.id);
                    modals.close(SELECT_MEDIA_MODAL_ID);
                  }
                })}>
                  Select Image
                </Button>
                {media && (
                  <Button leftSection={<IconPhotoOff />} onClick={() => {
                    setMedia(null);
                    onChange(null);
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
  },

  defaultSettings: {
    mimeTypes: []
  },

  renderSettings: ({
    settings, onChange, registerValidator, unregisterValidator
  }) => {
    const setSetting = useSettingsHandler(settings, onChange);

    const errors = useInputValidator(
      (v) => ({
        mimeTypes: !v.mimeTypes.every((v) => v.match(MIME_REGEX)) ?
          'One or more mime types are invalid' : null
      }),
      registerValidator,
      unregisterValidator
    );

    return (
      <Stack>
        <TagsInput label="Mime Types" data={['image/*', 'image/png', 'image/jpeg']}
          description="Limit file selections by mime type" splitChars={[',', ' ']}
          value={settings.mimeTypes} onChange={(v) => setSetting('mimeTypes', v)}
          error={errors?.mimeTypes} />
      </Stack>
    );
  },

  validate: async (stringifiedValue, deserialize, required, settings, req) => {
    console.log('media input');

    if (required && !stringifiedValue) {
      throw new ExpressError('Required Media Input does not have a value');
    }
    
    const value = deserialize(stringifiedValue);
    if (!value) return;
    if (settings.mimeTypes?.length === 0) return;

    const resp = await serverInputFetch(
      req,
      ({ websiteId }) => `/api/websites/${websiteId}/media/${value}`
    );

    if (resp.status === 404) {
      throw new ExpressError('Selected media file does not exist');
    }

    if (resp.status !== 200) return;

    const media: MediaWithUrls = await resp.json();

    if (!settings.mimeTypes.some((type) => mimeTypeMatch(media.fileType, type))) {
      throw new ExpressError('Media Input image is an invalid type');
    }
  },

  validateSettings: (settings) => {
    if (settings.mimeTypes && !Array.isArray(settings.mimeTypes)) {
      throw new ExpressError('Mime Types must be an array');
    }

    if (!settings.mimeTypes?.every((v) => typeof v === 'string')) {
      throw new ExpressError('All mime type values must be strings');
    }

    if (!settings.mimeTypes?.every((v) => v.match(MIME_REGEX))) {
      throw new ExpressError('One or more mime types are invalid');
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
