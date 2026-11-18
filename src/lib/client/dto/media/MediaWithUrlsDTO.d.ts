import MediaDTO from './MediaDTO';

export default class MediaWithUrlsDTO extends MediaDTO {
  readonly url: string;
  readonly thumbUrl: string | null;

  constructor(
    id: string,
    websiteId: string,
    origFileName: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    thumbName: string | null,
    timestamp: number,
    url: string,
    thumbUrl: string | null
  );

  static fromJSON(json: any): MediaWithUrlsDTO;
  clone(): MediaWithUrlsDTO;
  toJSON(): {
    id: string
    websiteId: string
    origFileName: string
    fileName: string
    fileSize: number
    fileType: string
    thumbName: string | null
    timestamp: number
    url: string
    thumbUrl: string | null
  };
}
