import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createHash, randomBytes } from 'crypto'
import type { Readable } from 'stream'

const PRESIGNED_URL_EXPIRY_SECONDS = 900 // 15 minutes
const BUCKET = process.env.S3_BUCKET_NAME ?? 'lodestone-documents'

function getS3Client(): S3Client {
  const config: ConstructorParameters<typeof S3Client>[0] = {
    region: process.env.S3_REGION ?? 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    },
  }

  // MinIO / local dev override
  if (process.env.S3_ENDPOINT) {
    config.endpoint = process.env.S3_ENDPOINT
    config.forcePathStyle = true
  }

  return new S3Client(config)
}

/**
 * Generate a structured S3 key for a document.
 * Format: {prefix}/{year}/{month}/{randomId}/{filename}
 */
export function generateS3Key(
  prefix: 'documents' | 'models' | 'reports' | 'temp',
  filename: string,
): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const id = randomBytes(16).toString('hex')
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
  return `${prefix}/${year}/${month}/${id}/${safe}`
}

/**
 * Compute SHA-256 hash of a buffer for integrity verification.
 */
export function computeFileHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

/**
 * Upload a file to S3 with server-side encryption (SSE-S3 AES-256).
 * Returns the S3 key and SHA-256 hash.
 */
export async function uploadFile(params: {
  key: string
  body: Buffer
  contentType: string
  metadata?: Record<string, string>
}): Promise<{ key: string; hash: string; sizeBytes: number }> {
  const client = getS3Client()
  const hash = computeFileHash(params.body)

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      ServerSideEncryption: 'AES256',
      Metadata: {
        'sha256-hash': hash,
        ...params.metadata,
      },
    }),
  )

  return { key: params.key, hash, sizeBytes: params.body.length }
}

/**
 * Download a file from S3.
 * Returns the file buffer and content type.
 */
export async function downloadFile(key: string): Promise<{
  body: Buffer
  contentType: string
  metadata: Record<string, string>
}> {
  const client = getS3Client()

  const response = await client.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
  )

  if (!response.Body) {
    throw new Error(`S3 object not found: ${key}`)
  }

  const chunks: Uint8Array[] = []
  const stream = response.Body as Readable
  for await (const chunk of stream) {
    chunks.push(chunk)
  }

  return {
    body: Buffer.concat(chunks),
    contentType: response.ContentType ?? 'application/octet-stream',
    metadata: response.Metadata ?? {},
  }
}

/**
 * Generate a presigned URL for secure, time-limited direct access.
 * Default expiry: 15 minutes.
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresInSeconds = PRESIGNED_URL_EXPIRY_SECONDS,
): Promise<string> {
  const client = getS3Client()

  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: expiresInSeconds },
  )
}

/**
 * Generate a presigned URL for secure, time-limited upload.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = PRESIGNED_URL_EXPIRY_SECONDS,
): Promise<string> {
  const client = getS3Client()

  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    }),
    { expiresIn: expiresInSeconds },
  )
}

/**
 * Check if an object exists in S3.
 */
export async function fileExists(key: string): Promise<boolean> {
  const client = getS3Client()
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

/**
 * Delete a file from S3. Use with extreme caution.
 * Only called for temp files or during admin operations.
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client()
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}
