import { Group, Stack } from '@mantine/core';
import { MediaWithUrls } from '../../common/types/Media';
import DataGetter from './DataGetter';
import GalleryFile from './GalleryFile';
import FilePreview from './FilePreview';
import { useIsMobile } from '../util/mobile';
import { PaginatedResponse } from '../../common/types/PaginatedResponse';
import Pagination from './Pagination';

export interface MediaGalleryProps {
  websiteId: string
  search?: string
  mimeTypes?: string[]
  refresh: () => void
  select?: (file: MediaWithUrls) => void
}

export default function MediaGallery({ websiteId, search, mimeTypes,
  refresh, select }: MediaGalleryProps) {
  const isMobile = useIsMobile();

  return (
    <DataGetter<PaginatedResponse<MediaWithUrls>> url={`/api/websites/${websiteId}/media`}
      skeletonComponent={(
        <FilePreview.Skeleton horizontal skeletonNum={7} skeletonProps={{
          mx: isMobile && 'auto'
        }} />
      )} sort="desc" paginate search={search} query={{
        mime: mimeTypes?.join(','),
        /*
         * 14 fits better on the Media page on desktop than 10.
         * The same is true for the Select Media modal, but with 9 instead
         */
        limit: (select ? '9' : '14')
      }}>
      {({ data: media, setPage }) => (
        <Stack>
          <Group align="stretch" justify={isMobile && 'center'}>
            {media.data
              .map((file) => (
                <GalleryFile key={file.id} file={file} select={select} refresh={refresh} />
              ))}
          </Group>
          <Pagination page={media.page} pages={media.pages} setPage={setPage} />
        </Stack>
      )}
    </DataGetter>
  );
}
