import type { S3PreSignedUrl } from './Media';

export default class UploadMediaResponseDTO {
  readonly id: string;
  readonly image: S3PreSignedUrl;
  readonly thumbnail: S3PreSignedUrl | null;
  readonly hmac: string;

  constructor(
    id: string,
    image: S3PreSignedUrl,
    thumbnail: S3PreSignedUrl | null,
    hmac: string
  );

  static fromJSON(json: any): UploadMediaResponseDTO;
  clone(): UploadMediaResponseDTO;
  toJSON(): {
    id: string
    image: S3PreSignedUrl
    thumbnail: S3PreSignedUrl | null
    hmac: string
  };
}
