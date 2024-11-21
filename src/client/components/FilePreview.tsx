import type { ReactNode } from 'react';
import { ActionIcon, Group, Image, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { IconDownload, IconEye, IconFile } from '@tabler/icons-react';
import ShortUuid from './ShortUuid';
import { bytesToReadableUnits } from '../util/media';
import type { MediaWithUrls } from '../../common/types/Media';
import IconButton from './IconButton';
import GenericSkeleton, { GenericSkeletonProps } from './GenericSkeleton';

interface Props {
  file: MediaWithUrls
  children?: ReactNode
}

function FilePreview({ file, children }: Props) {
  const SIZE = 192;

  const size = {
    h: SIZE,
    w: SIZE
  };

  return (
    <>
      <Paper bg="gray" {...size}>
        <Stack justify="center" align="center" h="100%">
          {file.thumbUrl ? (
            <Image {...size} fit="contain" src={file.thumbUrl} loading="lazy" />
          ) : (
            <IconFile size={48} />
          )}
        </Stack>
      </Paper>

      <Tooltip label={file.origFileName}>
        <Text mx="auto" fw="bold" maw={180} truncate="end">{file.origFileName}</Text>
      </Tooltip>
      <Text mx="auto" c="dimmed" fz="sm">ID: <ShortUuid uuid={file.id} /></Text>
      <Tooltip label={`${file.fileSize.toLocaleString()} bytes`}>
        <Text mx="auto" c="dimmed" fz="sm">Size: {bytesToReadableUnits(file.fileSize)}</Text>
      </Tooltip>

      <Group gap="sm" justify="center">
        {children}
      </Group>
    </>
  );
}

interface ViewButtonProps {
  file: MediaWithUrls
}

function ViewButton({ file }: ViewButtonProps) {
  return (
    <IconButton label={file.thumbUrl ? 'View' : 'Download'}>
      <ActionIcon component="a" href={file.url} target="_blank">
        {file.thumbUrl ? <IconEye /> : <IconDownload />}
      </ActionIcon>
    </IconButton>
  );
}

function Skeleton({ skeletonProps, ...props }: GenericSkeletonProps) {
  return (
    <GenericSkeleton skeletonProps={{
      ...skeletonProps,
      h: 290,
      w: 192
    }} {...props} />
  );
}

FilePreview.ViewButton = ViewButton;
FilePreview.Skeleton = Skeleton;
export default FilePreview;
