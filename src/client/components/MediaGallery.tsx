import { Group } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { MediaWithUrls } from '../../common/types/Media';
import DataGetter from './DataGetter';
import GalleryFile from './GalleryFile';
import FilePreview from './FilePreview';

export interface MediaGalleryProps {
  websiteId: string
  refresh: () => void
  select?: (file: MediaWithUrls) => void
}

export default function MediaGallery({ websiteId, refresh, select }: MediaGalleryProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <DataGetter<MediaWithUrls[]> url={`/api/websites/${websiteId}/media`}
      skeletonComponent={(
        <FilePreview.Skeleton horizontal skeletonNum={7} skeletonProps={{
          mx: isMobile && 'auto'
        }} />
      )}>
      {(media) => (
        <Group align="stretch" justify={isMobile && 'center'}>
          {media.map((file) => (
            <GalleryFile key={file.id} file={file} select={select} refresh={refresh} />
          ))}
        </Group>
      )}
    </DataGetter>
  );
}
