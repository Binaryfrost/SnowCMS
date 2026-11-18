import type { Request, Response } from 'express';
import ConfirmMediaUploadDTO from '../../../lib/client/dto/media/ConfirmMediaUploadDTO';
import UploadMediaDTO from '../../../lib/client/dto/media/UploadMediaDTO';
import { SuccessDTOBuilder } from '../../../lib/client/dto/SuccessDTO';
import Controller from '../Controller';
import type { IMediaService } from './MediaService';

export default class MediaController extends Controller {
  private mediaService: IMediaService;

  constructor(mediaService: IMediaService) {
    super();
    this.mediaService = mediaService;
  }

  async getAll(req: Request, res: Response) {
    const { websiteId } = req.params;
    const { search, mime } = req.query;

    const dto = await this.mediaService.getAllMedia(
      websiteId,
      search as string,
      mime as string,
      this.getPaginationOpts(req)
    );
    res.json(dto.toJSON());
  }

  async getConfig(req: Request, res: Response) {
    const { websiteId } = req.params;
    const dto = await this.mediaService.getMediaConfig(websiteId);
    res.json(dto.toJSON());
  }

  async get(req: Request, res: Response) {
    const dto = await this.mediaService.getMedia(req.params.id);
    res.json(dto.toJSON());
  }

  async upload(req: Request, res: Response) {
    const { websiteId } = req.params;
    const upload = UploadMediaDTO.fromJSON(req.body);
    const dto = await this.mediaService.uploadMedia(websiteId, upload);
    res.json(dto.toJSON());
  }

  async confirmUpload(req: Request, res: Response) {
    const { websiteId } = req.params;
    const confirm = ConfirmMediaUploadDTO.fromJSON(req.body);
    const id = await this.mediaService.confirmUploadMedia(websiteId, confirm);

    const { name } = confirm.data.image;
    res.json(new SuccessDTOBuilder()
      .withMessage(`Uploaded file with name ${name}`)
      .withId(id)
      .build()
      .toJSON());
  }

  async delete(req: Request, res: Response) {
    const { websiteId, id } = req.params;
    await this.mediaService.deleteMedia(websiteId, id);

    res.json(new SuccessDTOBuilder()
      .withMessage('File deleted')
      .build()
      .toJSON());
  }
}
