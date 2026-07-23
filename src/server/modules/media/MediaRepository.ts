import type { Knex } from 'knex';
import PaginatedQuery, { PaginatedQueryOpts } from '../../database/PaginatedQuery';
import Repository from '../Repository';
import MediaModel from './MediaModel';
import NotFoundError from '../../../common/errors/base/NotFoundError';

export interface MediaTable {
  id: string
  websiteId: string
  origFileName: string
  fileName: string
  fileSize: number
  fileType: string
  thumbName?: string
  timestamp: number
}

export default class MediaRepository extends Repository {
  constructor(db: Knex) {
    super(db, 'media');
  }

  private convertMimeType(mime: string) {
    if (mime.endsWith('/*')) {
      return mime.replace('/*', '/%');
    }

    return mime;
  }

  async getAllMedia(
    websiteId: string,
    search?: string,
    mime?: string,
    opts?: PaginatedQueryOpts
  ): Promise<PaginatedQuery<MediaModel>> {
    const searchQuery = search ? `%${search}%` : undefined;

    const query = this.db<MediaTable>(this.table)
      .select(
        'id',
        'websiteId',
        'origFileName',
        'fileName',
        'fileSize',
        'fileType',
        'thumbName',
        'timestamp'
      )
      .where((builder: Knex.QueryBuilder) => {
        builder.where((builder2) => {
          if (searchQuery) {
            builder2.whereILike('id', searchQuery);
            builder2.orWhereILike('fileName', searchQuery);
            builder2.orWhereILike('origFileName', searchQuery);
          }
        });

        if (mime) {
          builder.andWhere((builder2) => {
            const mimeTypes = (mime as string).split(',')
              .map(this.convertMimeType);
            for (const mimeType of mimeTypes) {
              builder2.orWhereILike('fileType', mimeType);
            }
          });
        }

        builder.andWhere('websiteId', websiteId);
      });

    return new PaginatedQuery(this.db, query, opts);
  }

  async getMediaById(id: string): Promise<MediaModel | null> {
    const query = await this.db<MediaTable>(this.table)
      .first(
        'id',
        'websiteId',
        'origFileName',
        'fileName',
        'fileSize',
        'fileType',
        'thumbName',
        'timestamp'
      )
      .where({
        id
      });

    if (!query) return null;
    const {
      websiteId,
      origFileName,
      fileName,
      fileSize,
      fileType,
      thumbName,
      timestamp
    } = query;
    return new MediaModel(
      id,
      websiteId,
      origFileName,
      fileName,
      fileSize,
      fileType,
      timestamp,
      thumbName
    );
  }

  async getUsedStorage(websiteId: string) {
    const result = await this.db<MediaTable>(this.table)
      .where({
        websiteId
      })
      .sum({
        sum: 'fileSize'
      })
      .first();

    if (!result) return 0;
    return parseInt(result.sum, 10) || 0;
  }

  async createMedia(media: MediaModel) {
    await this.db<MediaTable>(this.table)
      .insert({
        id: media.getId(),
        websiteId: media.getWebsiteId(),
        origFileName: media.getOrigFileName(),
        fileName: media.getFileName(),
        fileSize: media.getFileSize(),
        fileType: media.getFileType(),
        thumbName: media.getThumbName() || undefined,
        timestamp: media.getTimestamp()
      });
  }

  async deleteMedia(id: string) {
    if (!(await this.exists(id))) {
      throw new NotFoundError('Media not found');
    }

    await this.db<MediaTable>(this.table)
      .where({
        id
      })
      .delete();
  }
}
