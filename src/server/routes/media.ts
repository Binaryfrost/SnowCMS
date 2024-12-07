import express from 'express';
import { v7 as uuid } from 'uuid';
import { basename, extname } from 'path';
import { createHmac } from 'crypto';
import slug from 'slug';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '../database/db';
import { handleAccessControl } from '../../common/users';
import { exists } from '../database/util';
import { getConfig } from '../config/config';
import type { FileMetadata, FileUploadConfirmation, FileUploadResponse, Media, MediaConfig } from '../../common/types/Media';
import { asyncRouteFix } from '../util';
import { BLOCKED_MIME_TYPES } from '../../common/blocked-mime-types';
import { callHook } from '../../common/plugins';
import ExpressError from '../../common/ExpressError';

const router = express.Router({ mergeParams: true });

const mediaUrl = (websiteId: string, fileName: string) => {
  const { publicUrl } = getConfig().media.s3;
  return new URL(`/media/${websiteId}/${fileName}`, publicUrl).toString();
};

async function getUsedStorage(websiteId: string) {
  const result = await db()<Media>('media')
    .where({
      websiteId
    })
    .sum({
      sum: 'fileSize'
    })
    .first();

  return parseInt(result.sum, 10) || 0;
}

async function createPreSignedUrl(fileName: string, websiteId: string, type: string, size: number) {
  const { s3 } = getConfig().media;

  const client = new S3Client({
    credentials: {
      accessKeyId: s3.accessKeyId,
      secretAccessKey: s3.secretAccessKey
    },
    region: s3.region,
    endpoint: s3.endpoint
  });

  const filePath = `media/${websiteId}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: s3.bucket,
    Key: filePath,
    ContentType: type,
    ContentLength: size
  });

  return {
    name: fileName,
    url: await getSignedUrl(client, command, {
      expiresIn: 300
    })
  };
}

function getUrlTimePart() {
  const date = new Date();
  const year = date.getUTCFullYear();
  // Month starts at 0
  const month = date.getUTCMonth() + 1;

  return `${year}/${month.toString().padStart(2, '0')}`;
}

function hmac(secret: string, ...data: any[]) {
  const h = createHmac('sha256', secret);
  h.update(data.join('.'));
  return h.digest().toString('hex');
}

router.get('/', asyncRouteFix(async (req, res) => {
  const { websiteId } = req.params;

  handleAccessControl(res, req.user, 'VIEWER', websiteId);

  if (!(await exists('websites', websiteId))) {
    throw new ExpressError('Website not found', 404);
  }

  const files: Media[] = await db<Media>()
    .select(
      'id',
      'websiteId',
      'fileName',
      'fileSize',
      'origFileName',
      'fileType',
      'thumbName',
      'timestamp'
    )
    .from('media')
    .where({
      websiteId
    })
    .orderBy('id', 'desc');

  res.json(
    files.map((file) => ({
      ...file,
      url: mediaUrl(websiteId, file.fileName),
      thumbUrl: file.thumbName ? mediaUrl(websiteId, file.thumbName) : undefined
    }))
  );
}));

router.get('/config', asyncRouteFix(async (req, res) => {
  const { websiteId } = req.params;

  handleAccessControl(res, req.user, 'VIEWER', websiteId);

  if (!(await exists('websites', websiteId))) {
    throw new ExpressError('Website not found', 404);
  }

  const { maxSize, maxStorage } = getConfig().media;

  res.json({
    maxSize,
    maxStorage,
    usedStorage: await getUsedStorage(websiteId)
  } satisfies MediaConfig);
}));

router.get('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, id } = req.params;

  handleAccessControl(res, req.user, 'VIEWER', websiteId);

  if (!(await exists('media', id))) {
    throw new ExpressError('File not found', 404);
  }

  const file: Media = await db<Media>()
    .select(
      'id',
      'websiteId',
      'fileName',
      'fileSize',
      'origFileName',
      'fileType',
      'thumbName',
      'timestamp'
    )
    .from('media')
    .where({
      id
    })
    .first();

  res.json({
    ...file,
    url: mediaUrl(websiteId, file.fileName),
    thumbUrl: file.thumbName ? mediaUrl(websiteId, file.thumbName) : undefined
  });
}));

router.post('/upload', asyncRouteFix(async (req, res) => {
  const { websiteId } = req.params;

  handleAccessControl(res, req.user, 'USER', websiteId);

  if (!(await exists('websites', websiteId))) {
    throw new ExpressError('Website not found', 404);
  }

  const { name, size, type, thumbnail }: FileMetadata = req.body;
  const { media, secret } = getConfig();
  const { maxSize, maxStorage } = media;
  const usedStorage = await getUsedStorage(websiteId);

  if (!name || !size || !type) {
    throw new ExpressError('Name, size, and type are required', 400);
  }

  // @ts-expect-error We don't yet know if it is a string or number
  if (Number.isNaN(parseInt(size, 10))) {
    throw new ExpressError('Size must be a number', 400);
  }

  if (thumbnail) {
    if (typeof thumbnail !== 'object') {
      throw new ExpressError('Thumbnail must be an object', 400);
    }

    if (!thumbnail.size || !thumbnail.type) {
      throw new ExpressError('Thumbnail must have size and type', 400);
    }
  }

  if ((size > maxSize) || (thumbnail && thumbnail.size > maxSize)) {
    throw new ExpressError('File is too big', 400);
  }

  if (usedStorage + size > maxStorage) {
    throw new ExpressError('Uploading file would exceed allocated storage', 400);
  }

  if (BLOCKED_MIME_TYPES.includes(type)) {
    throw new ExpressError(`File type ${type} is not allowed`, 400);
  }

  const id = uuid();
  const shortId = id.split('-').reverse()[0];
  const extension = extname(name);
  const imgSlug = slug(basename(name, extension)).substring(0, 48);
  const newFileName = `${getUrlTimePart()}/${shortId}-${imgSlug}${extension}`;
  const thumbFileName = thumbnail && `${getUrlTimePart()}/thumb-${shortId}-${imgSlug}${extension}`;

  const uploadMedia: Omit<Media, 'timestamp'> = {
    id,
    websiteId,
    fileName: newFileName,
    origFileName: name,
    fileSize: size,
    fileType: type,
    thumbName: thumbFileName
  };

  callHook('beforeMediaCreateHook', {
    media: uploadMedia
  });

  res.json({
    id,
    upload: {
      image: await createPreSignedUrl(newFileName, websiteId, type, size),
      thumbnail: thumbnail && await createPreSignedUrl(
        thumbFileName, websiteId, thumbnail.type, thumbnail.size
      )
    },
    hmac: hmac(secret, id, name, newFileName, size, type, thumbFileName)
  } satisfies FileUploadResponse);

  callHook('afterMediaCreateHook', {
    media: uploadMedia
  });
}));

router.post('/upload/confirm', asyncRouteFix(async (req, res) => {
  const { websiteId } = req.params;

  handleAccessControl(res, req.user, 'USER', websiteId);

  if (!(await exists('websites', websiteId))) {
    throw new ExpressError('Website not found', 404);
  }

  const { data, id, hmac: confirmationHmac }: FileUploadConfirmation = req.body;

  if (!data.image) {
    throw new ExpressError('Image data is required', 400);
  }

  const { name, size, type, s3Name } = data.image;
  const thumbFileName = data.thumbnail && data.thumbnail.s3Name;

  if (!name || !size || !type || !s3Name) {
    throw new ExpressError('Name, size, type, and s3Name is required', 400);
  }

  if (data.thumbnail && !data.thumbnail.s3Name) {
    throw new ExpressError('s3Name is required if thumbnail exists');
  }

  const { secret } = getConfig();

  const h = hmac(secret, id, name, s3Name, size, type, thumbFileName);

  if (h !== confirmationHmac) {
    throw new ExpressError('Invalid HMAC for file upload', 400);
  }

  const uploadMedia: Media = {
    id,
    websiteId,
    origFileName: name,
    fileName: s3Name,
    fileSize: size,
    fileType: type,
    thumbName: thumbFileName || null,
    timestamp: Math.floor(Date.now() / 1000)
  };

  await db<Media>()
    .into('media')
    .insert(uploadMedia);

  res.json({
    id,
    message: `Uploaded file with name ${name}`
  });

  callHook('afterMediaConfirmHook', {
    media: {
      ...uploadMedia,
      url: mediaUrl(websiteId, uploadMedia.fileName),
      thumbUrl: uploadMedia.thumbName ? mediaUrl(websiteId, uploadMedia.thumbName) : undefined
    }
  });
}));

router.delete('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, id } = req.params;

  handleAccessControl(res, req.user, 'USER', websiteId);

  if (!(await exists('websites', websiteId))) {
    throw new ExpressError('Website not found', 404);
  }

  const file = await db()<Media>('media')
    .select(
      'id',
      'websiteId',
      'origFileName',
      'fileName',
      'fileSize',
      'fileType',
      'thumbName',
      'timestamp'
    )
    .where({
      id
    })
    .first();

  if (!file) {
    throw new ExpressError('File not found', 404);
  }

  callHook('beforeMediaDeleteHook', {
    media: file
  });

  const { s3 } = getConfig().media;

  const client = new S3Client({
    credentials: {
      accessKeyId: s3.accessKeyId,
      secretAccessKey: s3.secretAccessKey
    },
    region: s3.region,
    endpoint: s3.endpoint
  });

  const filePath = (fileName: string) => `media/${websiteId}/${fileName}`;

  const toDelete = [
    filePath(file.fileName),
    file.thumbName && filePath(file.thumbName)
  ].filter(Boolean);

  for await (const fileToDelete of toDelete) {
    const command = new DeleteObjectCommand({
      Bucket: s3.bucket,
      Key: fileToDelete
    });

    await client.send(command);
  }

  await db()<Media>('media')
    .where({
      id
    })
    .delete();

  res.json({
    message: 'File deleted'
  });

  callHook('afterMediaDeleteHook', {
    media: file
  });
}));

export default router;
