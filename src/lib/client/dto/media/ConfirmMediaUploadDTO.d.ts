import type { FileUploadConfirmationData } from './Media';

export default class ConfirmMediaUploadDTO {
  readonly id: string;
  readonly data: FileUploadConfirmationData;
  readonly hmac: string;

  constructor(id: string, data: FileUploadConfirmationData, hmac: string);

  static fromJSON(json: any): ConfirmMediaUploadDTO;
  clone(): ConfirmMediaUploadDTO;
  toJSON(): {
    id: string
    data: FileUploadConfirmationData
    hmac: string
  };
}
