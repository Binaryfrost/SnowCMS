import BadRequestError from '../../../common/errors/base/BadRequestError';
import Service from '../Service';
import { IS3Service } from './S3Service';

export default class DisabledS3Service extends Service implements IS3Service {
  createPreSignedUrl(): Promise<string> {
    throw this.error();
  }

  deleteFile(): Promise<void> {
    throw this.error();
  }

  private error() {
    return new BadRequestError('S3 features disabled');
  }
}
