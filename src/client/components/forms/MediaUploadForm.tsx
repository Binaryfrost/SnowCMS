import { Box, Modal, Stack, Text, rem } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE, MIME_TYPES } from '@mantine/dropzone';
import { IconFileUpload, IconUpload, IconX } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { FileUploadConfirmation, FileUploadResponse, type FileMetadata, type MediaConfig } from '../../../common/types/Media';
import { bytesToReadableUnits, generateThumbnail } from '../../util/media';
import { post, s3Upload } from '../../util/api';
import { handleFormResponseNotification } from '../../util/form';

export interface MediaUploadFormProps extends MediaConfig {
  websiteId: string
  opened: boolean
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
          onDrop={async (files) => {
            try {
              const file = files[0];

              if (props.usedStorage + uploadedData.current + file.size > props.maxStorage) {
                throw new Error('Unable to upload file without exceeding allocated storage');
              }

              setError(null);
              setUploading(true);
              console.log('accepted files', files);

              const generateThumbnailFor = [
                MIME_TYPES.jpeg,
                MIME_TYPES.png,
                MIME_TYPES.gif
              ];
              const thumbnail = generateThumbnailFor.includes(file.type as any) &&
                await generateThumbnail(file);
              console.log('thumbnail', thumbnail.size, thumbnail);

              const metadata: FileMetadata = {
                name: file.name,
                size: file.size,
                type: file.type,
                thumbnail: thumbnail && {
                  size: thumbnail.size,
                  type: 'image/png'
                }
              };

              const resp = await post<FileUploadResponse>(
                `/api/websites/${props.websiteId}/media/upload`, metadata
              );
              console.log(resp);

              if (resp.status !== 200) {
                throw new Error(resp.body.error || 'An error occurred');
              }

              const uploads = [
                s3Upload(resp.body.upload.image.url, file.type, file),
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
                    type: file.type
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
              console.log('confirm', confirmResp);

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
          onReject={(files) => setError(files[0].errors[0].message)} maxSize={props.maxSize}
          accept={IMAGE_MIME_TYPE} multiple={false} loading={uploading}>
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
