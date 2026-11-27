import { DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, PutObjectCommand,
  S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import MediaConfigProvider from '../config/MediaConfigProvider';
import Service from '../Service';

export interface IS3Service {
  createPreSignedUrl(filePath: string, type: string, size: number): Promise<string>
  deleteFile(filePath: string): Promise<void>
  deleteFolder(prefix: string): Promise<void>
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

  // https://www.codemzy.com/blog/delete-s3-folder-nodejs
  async deleteFolder(prefix: string) {
    const recursiveDelete = async (token?: string) => {
      const listCommand = new ListObjectsV2Command({
        Bucket: this.config.getS3Bucket(),
        Prefix: prefix,
        ContinuationToken: token
      });

      const list = await this.s3Client.send(listCommand);
      if (list.KeyCount) {
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: this.config.getS3Bucket(),
          Delete: {
            Objects: list.Contents.map((item) => ({ Key: item.Key })),
            Quiet: false
          }
        });

        const deleted = await this.s3Client.send(deleteCommand);
        if (deleted.Errors) {
          deleted.Errors.map((error) => console.log(`${error.Key} could not ` +
            `be deleted - ${error.Code}`));
        }
      }

      if (list.NextContinuationToken) {
        return recursiveDelete(list.NextContinuationToken);
      }

      return undefined;
    };

    return recursiveDelete();
  }
}
