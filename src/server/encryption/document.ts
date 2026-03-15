import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-ctr'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits for CTR mode

export interface DocumentEncryptionMetadata {
  key: string // base64-encoded encrypted document key
  iv: string // base64-encoded IV
  algorithm: string
  keyVersion: string
}

/**
 * Generate a fresh random document encryption key.
 */
function generateDocumentKey(): Buffer {
  return randomBytes(KEY_LENGTH)
}

/**
 * Encrypt a document buffer using AES-256-CTR.
 * A fresh key and IV are generated for each document.
 * The key itself should be stored encrypted (e.g., via KMS or field encryption).
 */
export async function encryptDocument(
  buffer: Buffer,
): Promise<{ encrypted: Buffer; key: string; iv: string; algorithm: string }> {
  const key = generateDocumentKey()
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()])

  return {
    encrypted,
    key: key.toString('base64'),
    iv: iv.toString('base64'),
    algorithm: ALGORITHM,
  }
}

/**
 * Decrypt a document buffer using AES-256-CTR.
 * The key and IV must match those used during encryption.
 */
export async function decryptDocument(
  encryptedBuffer: Buffer,
  key: string,
  iv: string,
): Promise<Buffer> {
  const keyBuffer = Buffer.from(key, 'base64')
  const ivBuffer = Buffer.from(iv, 'base64')

  const decipher = createDecipheriv(ALGORITHM, keyBuffer, ivBuffer)
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()])
}
