import { ActionIcon, Paper, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import type MediaWithUrlsDTO from '../../lib/client/dto/media/MediaWithUrlsDTO';
import IconButton from './IconButton';
import DeleteButton from './DeleteButton';
import FilePreview from './FilePreview';

interface Props {
  file: MediaWithUrlsDTO
  refresh: () => void
  select?: (file: MediaWithUrlsDTO) => void
}

export default function GalleryFile({ file, refresh, select }: Props) {
  return (
    <Paper withBorder>
      <Stack gap={0}>
        <FilePreview file={file}>
          {select && (
            <IconButton label="Select">
              <ActionIcon onClick={() => select(file)}>
                <IconPlus />
              </ActionIcon>
            </IconButton>
          )}

          <FilePreview.ViewButton file={file} />

          <DeleteButton type="File" role="USER" id={file.id} onDelete={refresh}
            additional="Links to this file will stop working."
            url={`/api/websites/${file.websiteId}/media/${file.id}`} />
        </FilePreview>
      </Stack>
    </Paper>
  );
}
