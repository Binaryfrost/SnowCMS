import { basename, extname } from 'path';
import slug from 'slug';
import NotFoundError from '../../../common/errors/base/NotFoundError';
import ConfirmMediaUploadDTO from '../../../lib/client/dto/media/ConfirmMediaUploadDTO';
import MediaConfigDTO from '../../../lib/client/dto/media/MediaConfigDTO';
import MediaCreateDTO from '../../../lib/client/dto/media/MediaCreateDTO';
import MediaDTO from '../../../lib/client/dto/media/MediaDTO';
import MediaListDTO from '../../../lib/client/dto/media/MediaListDTO';
import MediaWithUrlsDTO from '../../../lib/client/dto/media/MediaWithUrlsDTO';
import UploadMediaDTO from '../../../lib/client/dto/media/UploadMediaDTO';
import UploadMediaResponseDTO from '../../../lib/client/dto/media/UploadMediaResponseDTO';
import PaginatedQuery, { PaginatedQueryOpts } from '../../database/PaginatedQuery';
import Service from '../Service';
import MediaModel from './MediaModel';
import MediaRepository from './MediaRepository';
import EncryptionService from '../common/EncryptionService';
import MediaConfigProvider from '../config/MediaConfigProvider';
import { BLOCKED_MIME_TYPES } from '../../../common/blocked-mime-types';
import TimeService from '../common/TimeService';
import BadRequestError from '../../../common/errors/base/BadRequestError';
import InvalidHmacError from '../../../common/errors/InvalidHmacError';
import type { IS3Service } from './S3Service';

export interface IMediaService {
  isEnabled(): boolean
  getAllMedia(
    websiteId: string,
    search?: string,
    mime?: string,
    opts?: PaginatedQueryOpts
  ): Promise<MediaListDTO>;
  getMedia(id: string): Promise<MediaWithUrlsDTO>
  getMediaConfig(websiteId: string): Promise<MediaConfigDTO>
  uploadMedia(websiteId: string, upload: UploadMediaDTO): Promise<UploadMediaResponseDTO>
  confirmUploadMedia(websiteId: string, confirm: ConfirmMediaUploadDTO): Promise<string>
  deleteMedia(websiteId: string, id: string): Promise<void>
  deleteAllMediaForWebsite(websiteId: string): Promise<void>
}

export default class MediaService extends Service implements IMediaService {
  private mediaRepo: MediaRepository;
  private config: MediaConfigProvider;
  private s3: IS3Service;
  private encrypt: EncryptionService;
  private time: TimeService;

  constructor(
    mediaRepo: MediaRepository,
    config: MediaConfigProvider,
    s3: IS3Service,
    encrypt: EncryptionService,
    time: TimeService
  ) {
    super();
    this.mediaRepo = mediaRepo;
    this.config = config;
    this.s3 = s3;
    this.encrypt = encrypt;
    this.time = time;
  }

  isEnabled() {
    return true;
  }

  async getAllMedia(
    websiteId: string,
    search?: string,
    mime?: string,
    opts?: PaginatedQueryOpts
  ) {
    const media = await this.mediaRepo.getAllMedia(websiteId, search, mime, opts);
    return this.adaptMedia(opts?.page || 1, media);
  }

  async getMedia(id: string) {
    const media = await this.mediaRepo.getMediaById(id);
    if (!media) {
      throw new NotFoundError('Media not found');
    }
    return this.adaptMediumWithUrls(media);
  }

  async getMediaConfig(websiteId: string) {
    return new MediaConfigDTO(
      this.config.getMaxSize(),
      this.config.getMaxStorage(),
      await this.mediaRepo.getUsedStorage(websiteId)
    );
  }

  private generateMediaUrl(websiteId: string, fileName: string) {
    const publicUrl = this.config.getS3PublicUrl();
    return new URL(`/media/${websiteId}/${fileName}`, publicUrl).toString();
  }

  private adaptMediumWithUrls(media: MediaModel): MediaWithUrlsDTO {
    return new MediaWithUrlsDTO(
      media.getId(),
      media.getWebsiteId(),
      media.getOrigFileName(),
      media.getFileName(),
      media.getFileSize(),
      media.getFileType(),
      media.getThumbName(),
      media.getTimestamp(),
      this.generateMediaUrl(media.getWebsiteId(), media.getFileName()),
      media.getThumbName() ?
        this.generateMediaUrl(media.getWebsiteId(), media.getThumbName()!) : null
    );
  }

  private adaptMedium(media: MediaModel): MediaDTO {
    return new MediaDTO(
      media.getId(),
      media.getWebsiteId(),
      media.getOrigFileName(),
      media.getFileName(),
      media.getFileSize(),
      media.getFileType(),
      media.getThumbName(),
      media.getTimestamp()
    );
  }

  private async adaptMedia(page: number, paginatedClient: PaginatedQuery<MediaModel>) {
    const { pages } = await paginatedClient.metadata();
    const media = await paginatedClient.getPage(page);

    return new MediaListDTO(
      page,
      pages,
      media.map((medium) => this.adaptMediumWithUrls(medium))
    );
  }

  private getUrlTimePart() {
    const date = new Date();
    const year = date.getUTCFullYear();
    // Month starts at 0
    const month = date.getUTCMonth() + 1;

    return `${year}/${month.toString().padStart(2, '0')}`;
  }

  private generateMediaUrlPath(websiteId: string, fileName: string) {
    return `media/${websiteId}/${fileName}`;
  }

  private async generateHmac(
    id: string,
    origFileName: string,
    newFileName: string,
    size: number,
    type: string,
    thumbnailName: string | null | undefined) {
    return this.encrypt.hmac([
      id, origFileName, newFileName, size, type, thumbnailName
    ].join('.'));
  }

  async uploadMedia(websiteId: string, upload: UploadMediaDTO) {
    const maxSize = this.config.getMaxSize();
    const maxStorage = this.config.getMaxStorage();
    const usedStorage = await this.mediaRepo.getUsedStorage(websiteId);
    if ((upload.size > maxSize) || ((upload.thumbnail?.size || 0) > maxSize)) {
      throw new BadRequestError('File is too big');
    }

    if (usedStorage + upload.size > maxStorage) {
      throw new BadRequestError('Uploading file would exceed allocated storage');
    }

    if (BLOCKED_MIME_TYPES.includes(upload.type)) {
      throw new BadRequestError(`File type ${upload.type} is not allowed`);
    }

    const id = MediaModel.generateId();
    const shortId = id.split('-').reverse()[0];
    const extension = extname(upload.name).toLowerCase();
    const imgSlug = slug(basename(upload.name, extension)).substring(0, 48);
    const imgBaseName = `${shortId}-${imgSlug}${extension}`;
    const newFileName = `${this.getUrlTimePart()}/${imgBaseName}`;
    const thumbName = upload.thumbnail ?
      `${this.getUrlTimePart()}/thumb-${imgBaseName}` : null;

    const media = new MediaCreateDTO(
      id,
      websiteId,
      upload.name,
      newFileName,
      upload.size,
      upload.type,
      thumbName
    );

    await this.callHook('beforeMediaCreateHook', { media });

    // Re-read the DTO after the before-hook so hook modifications take effect.
    // A thumbnail is only usable if the upload included thumbnail metadata.
    const hasThumbnail = !!media.thumbName && !!upload.thumbnail;

    const hmac = await this.generateHmac(
      media.id,
      media.origFileName,
      media.fileName,
      media.fileSize,
      media.fileType,
      hasThumbnail ? media.thumbName : null
    );

    const response = new UploadMediaResponseDTO(
      media.id,
      {
        name: media.fileName,
        origFileName: media.origFileName,
        url: await this.s3.createPreSignedUrl(
          this.generateMediaUrlPath(websiteId, media.fileName),
          media.fileType,
          media.fileSize
        )
      },
      hasThumbnail ? {
        name: media.thumbName!,
        url: await this.s3.createPreSignedUrl(
          this.generateMediaUrlPath(websiteId, media.thumbName!),
          upload.thumbnail!.type,
          upload.thumbnail!.size
        )
      } : null,
      hmac
    );

    await this.callHook('afterMediaCreateHook', { media });

    return response;
  }

  async confirmUploadMedia(websiteId: string, confirm: ConfirmMediaUploadDTO) {
    const { id, data, hmac } = confirm;
    const { image, thumbnail } = data;
    const computedHmac = await this.generateHmac(
      id,
      image.name,
      image.s3Name,
      image.size,
      image.type,
      thumbnail?.s3Name
    );

    if (!(await this.encrypt.secureCompare(hmac, computedHmac))) {
      throw new InvalidHmacError();
    }

    const media = new MediaModel(
      id,
      websiteId,
      image.name,
      image.s3Name,
      image.size,
      image.type,
      this.time.timestampSec(),
      thumbnail?.s3Name
    );

    await this.mediaRepo.createMedia(media);

    await this.callHook('afterMediaConfirmHook', {
      media: this.adaptMediumWithUrls(media)
    });

    return id;
  }

  async deleteMedia(websiteId: string, id: string) {
    const media = await this.mediaRepo.getMediaById(id);
    if (!media) {
      throw new NotFoundError('Media not found');
    }

    const dto = this.adaptMedium(media);
    await this.callHook('beforeMediaDeleteHook', { media: dto });

    const toDelete = [
      this.generateMediaUrlPath(websiteId, media.getFileName()),
      media.getThumbName() && this.generateMediaUrlPath(websiteId, media.getThumbName()!)
    ].filter(Boolean);

    await Promise.all(
      toDelete.map((file) => this.s3.deleteFile(file!))
    );

    await this.mediaRepo.deleteMedia(id);
    await this.callHook('afterMediaDeleteHook', { media: dto });
  }

  async deleteAllMediaForWebsite(websiteId: string) {
    await this.s3.deleteFolder(`media/${websiteId}/`);
    await this.mediaRepo.deleteAllMediaForWebsite(websiteId);
  }
}
