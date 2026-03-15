import { db } from '@/server/db'
import { createHash } from 'crypto'
import type { AuditEventInput, AuditLogFilter } from './types'

// Fields that must never appear in audit log details
const SENSITIVE_FIELD_PATTERNS = [
  /ssn/i,
  /social.?security/i,
  /bank.?account/i,
  /routing.?number/i,
  /tax.?id/i,
  /ein/i,
  /password/i,
  /secret/i,
  /token/i,
  /credit.?card/i,
  /cvv/i,
  /\bpin\b/i,
  /mfa.?secret/i,
  /private.?key/i,
]

/**
 * Recursively redact sensitive fields from an object before writing to audit log.
 * This ensures no RESTRICTED field values (SSN, bank accounts, etc.) appear in audit details.
 */
export function redactSensitiveFields(
  details: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(details)) {
    const isSensitive = SENSITIVE_FIELD_PATTERNS.some((pattern) =>
      pattern.test(key),
    )

    if (isSensitive) {
      result[key] = '[REDACTED]'
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = redactSensitiveFields(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item !== null && typeof item === 'object'
          ? redactSensitiveFields(item as Record<string, unknown>)
          : item,
      )
    } else {
      result[key] = value
    }
  }

  return result
}

/**
 * Compute a tamper-detection hash for an audit log entry.
 * The hash covers all immutable fields so any off-band mutation is detectable.
 */
function computeIntegrityHash(fields: {
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  ipAddress?: string
  occurredAt: string
  metadata?: unknown
}): string {
  const payload = JSON.stringify({
    userId: fields.userId ?? '',
    action: fields.action,
    resourceType: fields.resourceType,
    resourceId: fields.resourceId ?? '',
    ipAddress: fields.ipAddress ?? '',
    occurredAt: fields.occurredAt,
    metadata: fields.metadata ?? {},
  })
  return createHash('sha256').update(payload).digest('hex')
}

/**
 * Write an immutable audit log entry.
 *
 * This function performs INSERT ONLY — never UPDATE or DELETE.
 * A PostgreSQL trigger `audit_immutable` (see SQL constant below) additionally
 * enforces immutability at the database level.
 *
 * Maps AuditEventInput onto the actual AuditLog Prisma schema fields:
 *  - actorId       → userId
 *  - action        → action
 *  - resource      → resourceType
 *  - resourceId    → resourceId
 *  - details       → metadata (after redaction)
 *  - result        → metadata.result
 *  - failReason    → metadata.failReason
 *  - subjectId     → metadata.subjectId
 *  - geoLocation   → metadata.geoLocation
 */
export async function writeAuditLog(event: AuditEventInput): Promise<void> {
  const sanitizedDetails = event.details
    ? redactSensitiveFields(event.details)
    : {}

  const occurredAt = new Date()

  // Build a consolidated metadata object for fields not in the schema columns
  const metadata: Record<string, unknown> = {
    result: event.result,
    ...(event.failReason && { failReason: event.failReason }),
    ...(event.subjectId && { subjectId: event.subjectId }),
    ...(event.geoLocation && { geoLocation: event.geoLocation }),
    ...sanitizedDetails,
  }

  const integrityHash = computeIntegrityHash({
    userId: event.actorId,
    action: event.action,
    resourceType: event.resource,
    resourceId: event.resourceId,
    ipAddress: event.ipAddress,
    occurredAt: occurredAt.toISOString(),
    metadata,
  })

  // INSERT ONLY — no upsert, no update, no delete
  await db.auditLog.create({
    data: {
      userId: event.actorId,
      userEmail: undefined, // populated by caller if available
      action: event.action,
      resourceType: event.resource,
      resourceId: event.resourceId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      metadata,
      integrityHash,
      occurredAt,
    },
  })
}

/**
 * Write an audit log with full actor email context (preferred when available).
 */
export async function writeAuditLogWithContext(
  event: AuditEventInput,
  context: { actorEmail?: string; actorRole?: string; sessionId?: string; requestId?: string },
): Promise<void> {
  const sanitizedDetails = event.details
    ? redactSensitiveFields(event.details)
    : {}

  const occurredAt = new Date()

  const metadata: Record<string, unknown> = {
    result: event.result,
    ...(event.failReason && { failReason: event.failReason }),
    ...(event.subjectId && { subjectId: event.subjectId }),
    ...(event.geoLocation && { geoLocation: event.geoLocation }),
    ...sanitizedDetails,
  }

  const integrityHash = computeIntegrityHash({
    userId: event.actorId,
    action: event.action,
    resourceType: event.resource,
    resourceId: event.resourceId,
    ipAddress: event.ipAddress,
    occurredAt: occurredAt.toISOString(),
    metadata,
  })

  await db.auditLog.create({
    data: {
      userId: event.actorId,
      userEmail: context.actorEmail,
      userRole: context.actorRole,
      action: event.action,
      resourceType: event.resource,
      resourceId: event.resourceId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      sessionId: context.sessionId,
      requestId: context.requestId,
      metadata,
      integrityHash,
      occurredAt,
    },
  })
}

/**
 * Write a permission-denied audit event.
 */
export async function writePermissionDenied(
  actorId: string,
  resource: AuditEventInput['resource'],
  resourceId: string,
  permission: string,
  ipAddress: string,
  userAgent: string,
): Promise<void> {
  await writeAuditLog({
    actorId,
    action: 'permission_denied',
    resource,
    resourceId,
    details: { permission },
    ipAddress,
    userAgent,
    result: 'denied',
    failReason: `Missing permission: ${permission}`,
  })
}

/**
 * Query audit logs with filters. Only accessible to COMPLIANCE role (enforced by caller).
 * This function reads but never mutates.
 *
 * Maps filter fields to actual AuditLog schema columns.
 */
export async function queryAuditLogs(filters: AuditLogFilter) {
  const {
    actorId,
    action,
    resource,
    resourceId,
    result,
    from,
    to,
    page = 1,
    pageSize = 50,
    search,
  } = filters

  const where: Parameters<typeof db.auditLog.findMany>[0]['where'] = {
    ...(actorId && { userId: actorId }),
    ...(action && { action }),
    ...(resource && { resourceType: resource }),
    ...(resourceId && { resourceId }),
    // result is stored inside metadata JSON — filter in application layer (see below)
    ...(from || to
      ? {
          occurredAt: {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
          },
        }
      : {}),
    ...(search && {
      OR: [
        { action: { contains: search, mode: 'insensitive' as const } },
        { resourceType: { contains: search, mode: 'insensitive' as const } },
        { resourceId: { contains: search, mode: 'insensitive' as const } },
        { userEmail: { contains: search, mode: 'insensitive' as const } },
        { ipAddress: { contains: search } },
      ],
    }),
  }

  const [allLogs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    db.auditLog.count({ where }),
  ])

  // Post-filter by result if specified (stored inside metadata JSON)
  const logs = result
    ? allLogs.filter((log) => {
        const meta = log.metadata as Record<string, unknown> | null
        return meta?.result === result
      })
    : allLogs

  return {
    logs,
    total,
    page,
    pageSize,
    pages: Math.ceil(total / pageSize),
  }
}

/**
 * SQL for the Postgres trigger that prevents AuditLog modifications.
 * Run this as part of the initial migration.
 *
 * CREATE OR REPLACE FUNCTION prevent_audit_modification()
 * RETURNS TRIGGER AS $$
 * BEGIN
 *   RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
 * END;
 * $$ LANGUAGE plpgsql;
 *
 * CREATE TRIGGER audit_immutable
 * BEFORE UPDATE OR DELETE ON "AuditLog"
 * FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
 */
export const AUDIT_IMMUTABILITY_TRIGGER_SQL = `
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_immutable ON "AuditLog";
CREATE TRIGGER audit_immutable
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
`
