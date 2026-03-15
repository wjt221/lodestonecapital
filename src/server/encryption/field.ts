import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from 'crypto'
import type { DataClassification } from '@prisma/client'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96 bits — recommended for GCM
const AUTH_TAG_LENGTH = 16 // 128 bits
const KEY_LENGTH = 32 // 256 bits

export interface EncryptedField {
  ciphertext: string // base64
  iv: string // base64
  authTag: string // base64
  keyVersion: string
}

/**
 * Derive the active encryption key from environment variables.
 * Supports key rotation via FIELD_ENCRYPTION_KEY_V{n} variables.
 * Falls back to FIELD_ENCRYPTION_KEY (v1).
 */
function getEncryptionKey(version = 'v1'): Buffer {
  let raw: string | undefined

  if (version === 'v1') {
    raw = process.env.FIELD_ENCRYPTION_KEY
  } else {
    raw = process.env[`FIELD_ENCRYPTION_KEY_${version.toUpperCase()}`]
  }

  if (!raw) {
    throw new Error(
      `Encryption key not configured: FIELD_ENCRYPTION_KEY${version !== 'v1' ? `_${version.toUpperCase()}` : ''}`,
    )
  }

  // Accept hex-encoded 32-byte key (64 hex chars)
  if (raw.length === 64) {
    return Buffer.from(raw, 'hex')
  }

  // Accept base64-encoded 32-byte key
  const buf = Buffer.from(raw, 'base64')
  if (buf.length !== KEY_LENGTH) {
    // Derive a 32-byte key via SHA-256 if the key is in another format
    return createHash('sha256').update(raw).digest()
  }
  return buf
}

function getActiveKeyVersion(): string {
  return process.env.FIELD_ENCRYPTION_KEY_VERSION ?? 'v1'
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Each call uses a fresh random IV (nonce).
 */
export async function encrypt(plaintext: string): Promise<EncryptedField> {
  const keyVersion = getActiveKeyVersion()
  const key = getEncryptionKey(keyVersion)
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    keyVersion,
  }
}

/**
 * Decrypt an EncryptedField back to plaintext.
 * Handles key rotation by using the keyVersion stored with the ciphertext.
 */
export async function decrypt(encrypted: EncryptedField): Promise<string> {
  const key = getEncryptionKey(encrypted.keyVersion)
  const iv = Buffer.from(encrypted.iv, 'base64')
  const authTag = Buffer.from(encrypted.authTag, 'base64')
  const ciphertext = Buffer.from(encrypted.ciphertext, 'base64')

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

/**
 * Serialize an EncryptedField to a string for storage in the database.
 */
export function serializeEncryptedField(field: EncryptedField): string {
  return JSON.stringify(field)
}

/**
 * Deserialize an EncryptedField from a database string.
 * Returns null if the value is not an encrypted field (i.e., plain text).
 */
export function deserializeEncryptedField(value: string): EncryptedField | null {
  try {
    const parsed = JSON.parse(value) as EncryptedField
    if (
      parsed.ciphertext &&
      parsed.iv &&
      parsed.authTag &&
      parsed.keyVersion
    ) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

/**
 * Encrypt a value if the data classification is RESTRICTED.
 * Returns the serialized encrypted field or the original value.
 */
export async function encryptIfRestricted(
  value: string,
  classification: DataClassification,
): Promise<string> {
  if (classification !== 'RESTRICTED') return value
  const encrypted = await encrypt(value)
  return serializeEncryptedField(encrypted)
}

/**
 * Decrypt a value if it appears to be an encrypted field.
 * Safe to call on any string — returns original if not encrypted.
 */
export async function decryptIfEncrypted(value: string): Promise<string> {
  const field = deserializeEncryptedField(value)
  if (!field) return value
  return decrypt(field)
}

/**
 * Re-encrypt a field using the current active key version.
 * Used during key rotation to migrate old ciphertext to new key.
 */
export async function rotateEncryption(encryptedValue: string): Promise<string> {
  const currentActiveVersion = getActiveKeyVersion()
  const field = deserializeEncryptedField(encryptedValue)

  if (!field) {
    // Plain text — encrypt with current key
    const encrypted = await encrypt(encryptedValue)
    return serializeEncryptedField(encrypted)
  }

  if (field.keyVersion === currentActiveVersion) {
    // Already on current key version
    return encryptedValue
  }

  // Decrypt with old key, re-encrypt with new key
  const plaintext = await decrypt(field)
  const reEncrypted = await encrypt(plaintext)
  return serializeEncryptedField(reEncrypted)
}
