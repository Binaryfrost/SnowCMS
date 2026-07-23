import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import MediaConfigProvider from '../config/MediaConfigProvider';
import Service from '../Service';

export interface IS3Service {
  createPreSignedUrl(filePath: string, type: string, size: number): Promise<string>
  deleteFile(filePath: string): Promise<void>
}

export default class S3Service extends Service implements IS3Service {
  private config: MediaConfigProvider;
  private s3Client: S3Client;

  constructor(config: MediaConfigProvider) {
    super();
    this.config = config;
    this.s3Client = new S3Client({
      credentials: {
        accessKeyId: this.config.getS3AccessKeyId(),
        secretAccessKey: this.config.getS3SecretAccessKey()
      },
      region: this.config.getS3Region(),
      endpoint: this.config.getS3Endpoint()
    });
  }

  async createPreSignedUrl(
    filePath: string, type: string, size: number
  ) {
    const command = new PutObjectCommand({
      Bucket: this.config.getS3Bucket(),
      Key: filePath,
      ContentType: type,
      ContentLength: size
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: 300
    });
  }

  async deleteFile(filePath: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.config.getS3Bucket(),
      Key: filePath
    });
    await this.s3Client.send(command);
  }
}
