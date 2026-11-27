import type { S3PreSignedUrl, UploadMediaImage } from './Media';

export default class UploadMediaResponseDTO {
  readonly id: string;
  readonly image: UploadMediaImage;
  readonly thumbnail: S3PreSignedUrl | null;
  readonly hmac: string;

  constructor(
    id: string,
    image: UploadMediaImage,
    thumbnail: S3PreSignedUrl | null,
    hmac: string
  );

  static fromJSON(json: any): UploadMediaResponseDTO;
  clone(): UploadMediaResponseDTO;
  toJSON(): {
    id: string
    image: UploadMediaImage
    thumbnail: S3PreSignedUrl | null
    hmac: string
  };
}
