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

const router = express.Router({ mergeParams: true });

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

  if (!handleAccessControl(res, req.user, 'VIEWER', websiteId)) return;

  if (!(await exists('websites', websiteId))) {
    res.status(404).json({
      error: 'Website not found'
    });
    return;
  }

  const { publicUrl } = getConfig().media.s3;

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

  const url = (fileName: string) => new URL(`/media/${websiteId}/${fileName}`, publicUrl);

  res.json(
    files.map((file) => ({
      ...file,
      url: url(file.fileName),
      thumbUrl: file.thumbName ? url(file.thumbName) : undefined
    }))
  );
}));

router.get('/config', asyncRouteFix(async (req, res) => {
  const { websiteId } = req.params;

  if (!handleAccessControl(res, req.user, 'VIEWER', websiteId)) return;

  if (!(await exists('websites', websiteId))) {
    res.status(404).json({
      error: 'Website not found'
    });
    return;
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

  if (!handleAccessControl(res, req.user, 'VIEWER', websiteId)) return;

  if (!(await exists('media', id))) {
    res.status(404).json({
      error: 'File not found'
    });
    return;
  }

  const { publicUrl } = getConfig().media.s3;

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

  const url = (fileName: string) => new URL(`/media/${websiteId}/${fileName}`, publicUrl);

  res.json({
    ...file,
    url: url(file.fileName),
    thumbUrl: file.thumbName ? url(file.thumbName) : undefined
  });
}));

router.post('/upload', asyncRouteFix(async (req, res) => {
  const { websiteId } = req.params;

  if (!handleAccessControl(res, req.user, 'USER', websiteId)) return;

  if (!(await exists('websites', websiteId))) {
    res.status(404).json({
      error: 'Website not found'
    });
    return;
  }

  const { name, size, type, thumbnail }: FileMetadata = req.body;
  const { media, secret } = getConfig();
  const { maxSize, maxStorage } = media;
  const usedStorage = await getUsedStorage(websiteId);

  if ((size > maxSize) || (thumbnail && thumbnail.size > maxSize)) {
    res.status(400).json({
      error: 'File is too big'
    });
    return;
  }

  if (usedStorage + size > maxStorage) {
    res.status(400).json({
      error: 'Uploading file would exceed allocated storage'
    });
    return;
  }

  if (BLOCKED_MIME_TYPES.includes(type)) {
    res.status(400).json({
      error: `File type ${type} is not allowed`
    });
    return;
  }

  const id = uuid();
  const shortId = id.split('-').reverse()[0];
  const extension = extname(name);
  const imgSlug = slug(basename(name, extension)).substring(0, 48);
  const newFileName = `${getUrlTimePart()}/${shortId}-${imgSlug}${extension}`;
  const thumbFileName = thumbnail && `${getUrlTimePart()}/thumb-${shortId}-${imgSlug}${extension}`;

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
}));

router.post('/upload/confirm', asyncRouteFix(async (req, res) => {
  const { websiteId } = req.params;

  if (!handleAccessControl(res, req.user, 'USER', websiteId)) return;

  if (!(await exists('websites', websiteId))) {
    res.status(404).json({
      error: 'Website not found'
    });
    return;
  }

  const { data, id, hmac: confirmationHmac }: FileUploadConfirmation = req.body;

  const { name, size, type, s3Name } = data.image;
  const thumbFileName = data.thumbnail && data.thumbnail.s3Name;

  const { secret } = getConfig();

  const h = hmac(secret, id, name, s3Name, size, type, thumbFileName);

  if (h !== confirmationHmac) {
    res.status(400).json({
      error: 'Invalid HMAC for file upload'
    });
    return;
  }

  await db<Media>()
    .into('media')
    .insert({
      id,
      websiteId,
      origFileName: name,
      fileName: s3Name,
      fileSize: size,
      fileType: type,
      thumbName: thumbFileName || null,
      timestamp: Math.floor(Date.now() / 1000)
    });

  res.json({
    id,
    message: `Uploaded file with name ${name}`
  });
}));

router.delete('/:id', asyncRouteFix(async (req, res) => {
  const { websiteId, id } = req.params;

  if (!handleAccessControl(res, req.user, 'USER', websiteId)) return;

  if (!(await exists('websites', websiteId))) {
    res.status(404).json({
      error: 'Website not found'
    });
    return;
  }

  const file = await db<Media>()
    .select('fileName', 'thumbName')
    .from('media')
    .where({
      id
    })
    .first();

  if (!file) {
    res.status(404).json({
      error: 'File not found'
    });
    return;
  }

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
}));

export default router;
