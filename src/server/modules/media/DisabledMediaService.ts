import BadRequestError from '../../../common/errors/base/BadRequestError';
import MediaDTO from '../../../lib/client/dto/media/MediaDTO';
import MediaListDTO from '../../../lib/client/dto/media/MediaListDTO';
import UploadMediaResponseDTO from '../../../lib/client/dto/media/UploadMediaResponseDTO';
import Service from '../Service';
import { IMediaService } from './MediaService';

export default class DisabledMediaService extends Service implements IMediaService {
  async getAllMedia(): Promise<MediaListDTO> {
    throw this.error();
  }

  async getMedia(): Promise<MediaDTO> {
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

  private error() {
    return new BadRequestError('Media features are disabled');
  }
}
