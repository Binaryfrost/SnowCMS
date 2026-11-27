import NotImplementedError from '../../../common/errors/base/NotImplementedError';
import MediaConfigDTO from '../../../lib/client/dto/media/MediaConfigDTO';
import MediaListDTO from '../../../lib/client/dto/media/MediaListDTO';
import MediaWithUrlsDTO from '../../../lib/client/dto/media/MediaWithUrlsDTO';
import UploadMediaResponseDTO from '../../../lib/client/dto/media/UploadMediaResponseDTO';
import Service from '../Service';
import type { IMediaService } from './MediaService';

export default class DisabledMediaService extends Service implements IMediaService {
  isEnabled() {
    return false;
  }

  async getAllMedia(): Promise<MediaListDTO> {
    throw this.error();
  }

  async getMedia(): Promise<MediaWithUrlsDTO> {
    throw this.error();
  }

  async getMediaConfig(): Promise<MediaConfigDTO> {
    throw this.error();
  }

  async uploadMedia(): Promise<UploadMediaResponseDTO> {
    throw this.error();
  }

  async confirmUploadMedia(): Promise<string> {
    throw this.error();
  }

  async deleteMedia(): Promise<void> {
    throw this.error();
  }

  async deleteAllMediaForWebsite(): Promise<void> {
    throw this.error();
  }

  private error() {
    return new NotImplementedError('Media features are disabled');
  }
}
