import NotImplementedError from '../../../common/errors/base/NotImplementedError';
import Service from '../Service';
import type { IS3Service } from './S3Service';

export default class DisabledS3Service extends Service implements IS3Service {
  createPreSignedUrl(): Promise<string> {
    throw this.error();
  }

  deleteFile(): Promise<void> {
    throw this.error();
  }

  deleteFolder(): Promise<void> {
    throw this.error();
  }

  private error() {
    return new NotImplementedError('S3 features disabled');
  }
}
