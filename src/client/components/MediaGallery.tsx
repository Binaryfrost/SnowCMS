import { Group } from '@mantine/core';
import { MediaWithUrls } from '../../common/types/Media';
import DataGetter from './DataGetter';
import GalleryFile from './GalleryFile';
import FilePreview from './FilePreview';
import { useIsMobile } from '../util/mobile';

export interface MediaGalleryProps {
  websiteId: string
  search?: string
  mimeTypes?: string[]
  refresh: () => void
  select?: (file: MediaWithUrls) => void
}

export default function MediaGallery({ websiteId, search, mimeTypes = [],
  refresh, select }: MediaGalleryProps) {
  const isMobile = useIsMobile();

  return (
    <DataGetter<MediaWithUrls[]> url={`/api/websites/${websiteId}/media`}
      skeletonComponent={(
        <FilePreview.Skeleton horizontal skeletonNum={7} skeletonProps={{
          mx: isMobile && 'auto'
        }} />
      )}>
      {(media) => (
        <Group align="stretch" justify={isMobile && 'center'}>
          {media
            .filter((m) => {
              if (mimeTypes.length === 0) return true;
              return mimeTypes.some((type) => {
                if (type.endsWith('/*')) {
                  const wildcardType = type.replace('/*', '');
                  return m.fileType.startsWith(wildcardType);
                }

                return m.fileType === type;
              });
            })
            .filter((m) => {
              if (!search) return true;
              return [m.fileName, m.origFileName, m.id]
                .some((s) => s.toLowerCase().includes(search));
            }).map((file) => (
              <GalleryFile key={file.id} file={file} select={select} refresh={refresh} />
            ))}
        </Group>
      )}
    </DataGetter>
  );
}
