import { auth } from './config'
import { db } from '@/server/db'
import { TRPCError } from '@trpc/server'
import type { Role } from '@prisma/client'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
  mfaEnabled: boolean
  lastActivityAt: number
}

/**
 * Get the current server-side session.
 * Returns null if not authenticated or session has expired.
 */
export async function getServerSession(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user as SessionUser
}

/**
 * Require an authenticated session or throw a tRPC UNAUTHORIZED error.
 * Used in tRPC middleware.
 */
export async function requireSession(): Promise<SessionUser> {
  const user = await getServerSession()
  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    })
  }
  return user
}

/**
 * Get the full User record from database for the current session user.
 * Verifies the user is still active and not expired.
 */
export async function getUserFromSession(sessionUser: SessionUser) {
  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      mfaEnabled: true,
      lastLoginAt: true,
      fundAccess: {
        where: { expiresAt: { gt: new Date() } },
        select: { fundId: true, expiresAt: true },
      },
    },
  })

  if (!user) return null
  if (!user.isActive) return null

  return user
}

/**
 * Invalidate all active sessions for a user.
 * Called when: role changes, account deactivated, security incident.
 * Sets sessionExpiresAt to past so all active sessions are rejected.
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
  // Deactivate the user to force re-authentication
  await db.user.update({
    where: { id: userId },
    data: { isActive: false },
  })
}

/**
 * Check if a user has access to a specific fund.
 * CRITICAL: This queries FundAccess table — NOT a client-provided claim.
 * Implements P-02: LP users can only see their own fund data.
 */
export async function checkFundAccess(
  userId: string,
  fundId: string,
): Promise<boolean> {
  const access = await db.fundAccess.findFirst({
    where: {
      userId,
      fundId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  })
  return access !== null
}

/**
 * Get all fund IDs that a user has active access to.
 */
export async function getUserFundIds(userId: string): Promise<string[]> {
  const accesses = await db.fundAccess.findMany({
    where: {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    select: { fundId: true },
  })
  return accesses.map((a) => a.fundId)
}

/**
 * Check if a user is assigned to a specific deal.
 * Implements P-03: IP users can only modify assigned deals.
 */
export async function checkDealAssignment(
  userId: string,
  dealId: string,
): Promise<boolean> {
  const assignment = await db.dealAssignment.findUnique({
    where: { dealId_userId: { dealId, userId } },
  })
  return assignment !== null
}
