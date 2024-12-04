export interface Media {
  id: string
  websiteId: string
  origFileName: string
  fileName: string
  fileSize: number
  fileType: string
  thumbName?: string
  timestamp: number
}

export interface MediaWithUrls extends Media {
  url: string
  thumbUrl?: string
}

export interface MediaConfig {
  maxSize: number,
  maxStorage: number,
  usedStorage: number
}

interface CommonFileMetadata {
  size: number
  type: string
}

export interface FileMetadata extends CommonFileMetadata {
  name: string
  thumbnail: CommonFileMetadata | false
}

interface S3PreSignedUrl {
  url: string
  name: string
}

export interface FileUploadResponse {
  id: string
  upload: {
    image: S3PreSignedUrl
    thumbnail?: S3PreSignedUrl
  }
  hmac: string
}

interface ConfirmationFileMetadata extends Omit<FileMetadata, 'thumbnail'> {
  s3Name: string
}

export interface FileUploadConfirmation {
  id: string
  data: {
    image: ConfirmationFileMetadata
    thumbnail?: {
      s3Name: string
    }
  }
  hmac: string
}
