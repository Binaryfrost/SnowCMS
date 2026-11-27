export interface CommonFileMetadata {
  size: number
  type: string
}

export interface FileMetadata extends CommonFileMetadata {
  name: string
  thumbnail: CommonFileMetadata | null
}

export interface S3PreSignedUrl {
  url: string
  name: string
}

export interface UploadMediaImage extends S3PreSignedUrl {
  origFileName: string
}

export interface FileUploadResponse {
  id: string
  upload: {
    image: UploadMediaImage
    thumbnail?: S3PreSignedUrl
  }
  hmac: string
}

export interface ConfirmationFileMetadata extends Omit<FileMetadata, 'thumbnail'> {
  s3Name: string
}

export interface FileUploadConfirmationData {
  image: ConfirmationFileMetadata
  thumbnail?: {
    s3Name: string
  }
}

export interface FileUploadConfirmation {
  id: string
  data: FileUploadConfirmationData
  hmac: string
}
