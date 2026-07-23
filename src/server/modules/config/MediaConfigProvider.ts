import { MediaConfig } from '../../../config';
import ConfigProvider from './ConfigProvider';

export default class MediaConfigProvider extends ConfigProvider {
  private maxSize: number;
  private maxStorage: number;
  private s3Endpoint: string;
  private s3Region: string;
  private s3Bucket: string;
  private s3AccessKeyId: string;
  private s3SecretAccessKey: string;
  private s3PublicUrl: string;

  constructor(config: MediaConfig) {
    super('media');
    this.maxSize = this.validator(config.maxSize, 'maxSize').integer().getValue() || 52428800;
    this.maxStorage = this.validator(config.maxStorage, 'maxStorage').integer()
      .getValue() || 5368709120;

    const s3 = this.validator(config.s3, 's3').required().object().of({
      endpoint: this.stringValidator,
      region: this.stringValidator,
      bucket: this.stringValidator,
      accessKeyId: this.stringValidator,
      secretAccessKey: this.stringValidator,
      publicUrl: this.stringValidator,
    })
      .getValue();

    this.s3Endpoint = s3.endpoint;
    this.s3Region = s3.region;
    this.s3Bucket = s3.bucket;
    this.s3AccessKeyId = s3.accessKeyId;
    this.s3SecretAccessKey = s3.secretAccessKey;
    this.s3PublicUrl = s3.publicUrl;
  }

  private stringValidator(value: any, name: string) {
    return this.validator(value, name).required().string();
  }

  getMaxSize() {
    return this.maxSize;
  }

  getMaxStorage() {
    return this.maxStorage;
  }

  getS3Endpoint() {
    return this.s3Endpoint;
  }

  getS3Region() {
    return this.s3Region;
  }

  getS3Bucket() {
    return this.s3Bucket;
  }

  getS3AccessKeyId() {
    return this.s3AccessKeyId;
  }

  getS3SecretAccessKey() {
    return this.s3SecretAccessKey;
  }

  getS3PublicUrl() {
    return this.s3PublicUrl;
  }
}
