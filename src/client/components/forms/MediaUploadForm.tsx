import { Box, Modal, Stack, Text, rem } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { IconFileUpload, IconUpload, IconX } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { FileUploadConfirmation, FileUploadResponse, type FileMetadata, type MediaConfig } from '../../../common/types/Media';
import { bytesToReadableUnits, generateThumbnail } from '../../util/media';
import { post, s3Upload } from '../../util/api';
import { handleFormResponseNotification } from '../../util/form';
import { BLOCKED_MIME_TYPES } from '../../../common/blocked-mime-types';

export interface MediaUploadFormProps extends MediaConfig {
  websiteId: string
  opened: boolean
  mimeTypes?: string[]
  close: () => void
}

export default function MediaUploadForm(props: MediaUploadFormProps) {
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const uploadedData = useRef(0);

  return (
    <Modal opened={props.opened} title="Upload Media" zIndex={300}
      closeOnClickOutside={!uploading} closeOnEscape={!uploadedData} withCloseButton={!uploading}
      onClose={() => {
        props.close();
      }}>
      <Stack>
        {error && <Text c="red">{error}</Text>}
        <Dropzone
          multiple={false} loading={uploading} accept={props.mimeTypes}
          onDrop={async (files) => {
            try {
              const file = files[0];
              const fileType = file.type || 'application/octet-stream';

              if (props.usedStorage + uploadedData.current + file.size > props.maxStorage) {
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
                `/api/websites/${props.websiteId}/media/upload`, metadata
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
                `/api/websites/${props.websiteId}/media/upload/confirm`, confirmData
              );

              if (confirmResp.status === 200) {
                uploadedData.current += file.size;
              }

              handleFormResponseNotification(confirmResp);
              setUploading(false);
            } catch (e) {
              setError(e.message || 'An error occurred');
              setUploading(false);
            }
          }}
          onReject={(files) => setError(files[0].errors[0].message)} maxSize={props.maxSize}>
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
                Maximum size: {bytesToReadableUnits(props.maxSize)}
              </Text>
            </Stack>
          </Stack>
        </Dropzone>
      </Stack>
    </Modal>
  );
}
