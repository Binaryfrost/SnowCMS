export default class MediaDTO {
  readonly id: string;
  readonly websiteId: string;
  readonly origFileName: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly fileType: string;
  readonly thumbName: string | null;
  readonly timestamp: number;

  constructor(
    id: string,
    websiteId: string,
    origFileName: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    thumbName: string | null,
    timestamp: number
  );

  static fromJSON(json: any): MediaDTO;
  clone(): MediaDTO;
  toJSON(): {
    id: string
    websiteId: string
    origFileName: string
    fileName: string
    fileSize: number
    fileType: string
    thumbName: string | null
    timestamp: number
  };
}
