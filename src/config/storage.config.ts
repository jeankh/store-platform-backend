export const storageConfig = {
  endpoint: process.env.S3_ENDPOINT || '',
  region: process.env.S3_REGION || '',
  bucket: process.env.S3_BUCKET || '',
}
