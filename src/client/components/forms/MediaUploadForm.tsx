import { Box, Modal, Stack, Text, rem } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { IconFileUpload, IconUpload, IconX } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { FileUploadConfirmation, FileUploadResponse, type FileMetadata, type MediaConfig } from '../../../common/types/Media';
import { bytesToReadableUnits, generateThumbnail } from '../../util/media';
import { post, s3Upload } from '../../util/api';
import { handleFormResponseNotification } from '../../util/form';
import { BLOCKED_MIME_TYPES } from '../../../common/blocked-mime-types';
import MediaStorageUsage from '../MediaStorageUsage';

export interface MediaUploadFormProps {
  websiteId: string
  config: MediaConfig
  opened: boolean
  mimeTypes?: string[]
  close: () => void
}

export default function MediaUploadForm({
  websiteId, config, opened, mimeTypes, close
}: MediaUploadFormProps) {
  const [usedStorage, setUsedStorage] = useState(config.usedStorage);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  return (
    <Modal opened={opened} title="Upload Media" zIndex={300}
      closeOnClickOutside={!uploading} closeOnEscape={!uploading} withCloseButton={!uploading}
      onClose={close}>
      <Stack>
        <MediaStorageUsage config={{
          ...config,
          usedStorage
        }} />
        {error && <Text c="red">{error}</Text>}
        <Dropzone
          multiple={false} loading={uploading} accept={mimeTypes}
          onDrop={async (files) => {
            try {
              const file = files[0];
              const fileType = file.type || 'application/octet-stream';

              if (usedStorage + file.size > config.maxStorage) {
                throw new Error('Unable to upload file without exceeding allocated storage');
              }

              if (BLOCKED_MIME_TYPES.includes(fileType)) {
                throw new Error(`File type ${fileType} is not allowed`);
              }

              setError(null);
              setUploading(true);

              const generateThumbnailFor = [
                MIME_TYPES.jpeg,
                MIME_TYPES.png,
                MIME_TYPES.gif
              ];
              const thumbnail = generateThumbnailFor.includes(fileType as any) &&
                await generateThumbnail(file);

              const metadata: FileMetadata = {
                name: file.name,
                size: file.size,
                type: fileType,
                thumbnail: thumbnail && {
                  size: thumbnail.size,
                  type: 'image/png'
                }
              };

              const resp = await post<FileUploadResponse>(
                `/api/websites/${websiteId}/media/upload`, metadata
              );

              if (resp.status !== 200) {
                throw new Error(resp.body.error || 'An error occurred');
              }

              const uploads = [
                s3Upload(resp.body.upload.image.url, fileType, file),
                thumbnail && s3Upload(resp.body.upload.thumbnail.url, thumbnail.type, thumbnail)
              ].filter(Boolean);

              const uploaded = await Promise.all(uploads);
              if (!uploaded.every((upload) => upload.status === 200)) {
                throw new Error('Failed to upload file');
              }

              const confirmData: FileUploadConfirmation = {
                id: resp.body.id,
                data: {
                  image: {
                    name: file.name,
                    s3Name: resp.body.upload.image.name,
                    size: file.size,
                    type: fileType
                  },
                  thumbnail: thumbnail && {
                    s3Name: resp.body.upload.thumbnail.name
                  }
                },
                hmac: resp.body.hmac
              };
              const confirmResp = await post(
                `/api/websites/${websiteId}/media/upload/confirm`, confirmData
              );

              if (confirmResp.status === 200) {
                setUsedStorage((v) => v + file.size);
              }

              handleFormResponseNotification(confirmResp);
              setUploading(false);
            } catch (e) {
              setError(e.message || 'An error occurred');
              setUploading(false);
            }
          }}
          onReject={(files) => setError(files[0].errors[0].message)} maxSize={config.maxSize}>
          <Stack align="center" style={{ pointerEvents: 'none' }}>
            <Box>
              <Dropzone.Accept>
                <IconUpload
                  style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-blue-6)' }}
                  stroke={1.5} />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX
                  style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-red-6)' }}
                  stroke={1.5} />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconFileUpload
                  style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-dimmed)' }}
                  stroke={1.5} />
              </Dropzone.Idle>
            </Box>

            <Stack align="center" gap={0}>
              <Text size="xl">
                Drag file here or click to select a file
              </Text>
              <Text size="sm" c="dimmed">
                Maximum size: {bytesToReadableUnits(config.maxSize)}
              </Text>
            </Stack>
          </Stack>
        </Dropzone>
      </Stack>
    </Modal>
  );
}
