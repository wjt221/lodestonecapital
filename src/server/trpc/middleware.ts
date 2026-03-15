import { TRPCError } from '@trpc/server'
import { middleware, publicProcedure, t } from './trpc'
import { getServerSession, getUserFromSession, checkFundAccess, checkDealAssignment } from '@/server/auth/session'
import { hasPermission, hasAnyPermission, Permission, assertPermission } from '@/server/auth/rbac'
import { writeAuditLog, writePermissionDenied } from '@/server/audit/logger'
import type { AuditAction, AuditResource } from '@/server/audit/types'
import type { Role } from '@prisma/client'

/**
 * Extract client IP from request headers (respects reverse proxy headers).
 */
function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    '0.0.0.0'
  )
}

/**
 * Extract user agent from request headers.
 */
function getUserAgent(headers: Headers): string {
  return headers.get('user-agent') ?? 'unknown'
}

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

/**
 * requireAuth — verifies authenticated session and session timeout (H-03: 15 min).
 * Attaches session user to context.
 */
export const requireAuth = middleware(async ({ ctx, next }) => {
  const session = await getServerSession()

  if (!session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    })
  }

  // Verify user still exists and is active in DB
  const user = await getUserFromSession(session)
  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Account is inactive or access has expired',
    })
  }

  return next({
    ctx: {
      ...ctx,
      session,
      user,
    },
  })
})

// ============================================================
// PERMISSION MIDDLEWARE
// ============================================================

/**
 * requirePermission — factory that creates middleware requiring a specific permission.
 * Writes a permission_denied audit log on failure.
 */
export function requirePermission(permission: Permission) {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
    }

    const headers = ctx.headers as Headers
    const ip = getClientIp(headers)
    const ua = getUserAgent(headers)

    if (!hasPermission(ctx.user.role as Role, permission)) {
      await writePermissionDenied(
        ctx.user.id,
        'System' as AuditResource,
        'system',
        permission,
        ip,
        ua,
      ).catch(() => {}) // Non-fatal: audit write failure should not expose error

      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Insufficient permissions: ${permission}`,
      })
    }

    return next({ ctx })
  })
}

/**
 * requireAnyPermission — requires at least one of the listed permissions.
 */
export function requireAnyPermission(permissions: Permission[]) {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
    }

    if (!hasAnyPermission(ctx.user.role as Role, permissions)) {
      const headers = ctx.headers as Headers
      const ip = getClientIp(headers)
      const ua = getUserAgent(headers)

      await writePermissionDenied(
        ctx.user.id,
        'System' as AuditResource,
        'system',
        permissions.join(' | '),
        ip,
        ua,
      ).catch(() => {})

      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Insufficient permissions. Requires one of: ${permissions.join(', ')}`,
      })
    }

    return next({ ctx })
  })
}

// ============================================================
// AUDIT MIDDLEWARE
// ============================================================

/**
 * auditLog — wraps a procedure to write audit log before/after execution.
 * Called on mutations and sensitive reads.
 */
export function auditLog(action: AuditAction, resource: AuditResource) {
  return middleware(async ({ ctx, next, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
    }

    const headers = ctx.headers as Headers
    const ip = getClientIp(headers)
    const ua = getUserAgent(headers)

    // Extract resource ID from input if available
    const inputObj = input as Record<string, unknown> | null
    const resourceId =
      (inputObj?.id as string) ??
      (inputObj?.dealId as string) ??
      (inputObj?.fundId as string) ??
      'unknown'

    let result: 'success' | 'failure' = 'success'
    let failReason: string | undefined

    try {
      const response = await next({ ctx })

      await writeAuditLog({
        actorId: ctx.user.id,
        action,
        resource,
        resourceId,
        details: inputObj ? { input: inputObj } : undefined,
        ipAddress: ip,
        userAgent: ua,
        result: 'success',
      }).catch(() => {})

      return response
    } catch (error) {
      result = 'failure'
      failReason = error instanceof Error ? error.message : 'Unknown error'

      await writeAuditLog({
        actorId: ctx.user.id,
        action,
        resource,
        resourceId,
        details: inputObj ? { input: inputObj } : undefined,
        ipAddress: ip,
        userAgent: ua,
        result,
        failReason,
      }).catch(() => {})

      throw error
    }
  })
}

// ============================================================
// FUND ACCESS MIDDLEWARE
// ============================================================

/**
 * requireFundAccess — for LP users, verifies they have active access to the fund.
 * Fund ID is extracted from input.fundId or verified from DB — NOT from client claim.
 * Implements P-02: tenant isolation for LP users.
 */
export function requireFundAccess(fundIdGetter: (input: unknown) => string) {
  return middleware(async ({ ctx, next, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
    }

    // Only enforce for LP users — other roles use their permissions
    if (ctx.user.role !== 'LP_VIEWER') {
      return next({ ctx })
    }

    const fundId = fundIdGetter(input)
    if (!fundId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Fund ID required' })
    }

    const hasAccess = await checkFundAccess(ctx.user.id, fundId)
    if (!hasAccess) {
      const headers = ctx.headers as Headers
      await writePermissionDenied(
        ctx.user.id,
        'Fund' as AuditResource,
        fundId,
        'fund_access',
        getClientIp(headers),
        getUserAgent(headers),
      ).catch(() => {})

      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this fund',
      })
    }

    return next({ ctx })
  })
}

/**
 * requireDealAssignment — for IP users, verifies they are assigned to the deal.
 * Implements P-03.
 */
export function requireDealAssignment(dealIdGetter: (input: unknown) => string) {
  return middleware(async ({ ctx, next, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
    }

    // Only enforce for junior investment team
    if (ctx.user.role !== 'ANALYST' && ctx.user.role !== 'ASSOCIATE') {
      return next({ ctx })
    }

    const dealId = dealIdGetter(input)
    if (!dealId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Deal ID required' })
    }

    const isAssigned = await checkDealAssignment(ctx.user.id, dealId)
    if (!isAssigned) {
      const headers = ctx.headers as Headers
      await writePermissionDenied(
        ctx.user.id,
        'Deal' as AuditResource,
        dealId,
        'deal_assignment',
        getClientIp(headers),
        getUserAgent(headers),
      ).catch(() => {})

      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You are not assigned to this deal',
      })
    }

    return next({ ctx })
  })
}
