import type { CommonFileMetadata, S3PreSignedUrl } from './Media';

export default class UploadMediaDTO {
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly thumbnail: CommonFileMetadata | null;

  constructor(name: string, size: number, type: string, thumbnail: CommonFileMetadata | null);

  static fromJSON(json: any): UploadMediaDTO;
  clone(): UploadMediaDTO;
  toJSON(): {
    name: string
    size: number
    type: string
    thumbnail: CommonFileMetadata | null
  };
}
